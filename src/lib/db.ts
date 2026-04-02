import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';

export const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'dev.db');

// Attach singleton to globalThis to survive Next.js HMR in dev
const globalDb = globalThis as typeof globalThis & { __filminternDb?: Database.Database };

function runMigration(db: Database.Database, sql: string, errorSubstring: string): void {
  try {
    db.exec(sql);
  } catch (err) {
    if (err instanceof Error && err.message.includes(errorSubstring)) return;
    throw err;
  }
}

function getDb(): Database.Database {
  if (globalDb.__filminternDb) return globalDb.__filminternDb;
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('cache_size = -32000');
  db.pragma('temp_store = MEMORY');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      projectType TEXT NOT NULL,
      fileName TEXT,
      uploadData TEXT,
      analysisData TEXT,
      reportDocument TEXT,
      generatedDocuments TEXT,
      criticAnalysis TEXT,
      fdxSource TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  // Migrations for databases created before these columns existed
  runMigration(db, 'ALTER TABLE projects ADD COLUMN uploadData TEXT', 'duplicate column name');
  runMigration(db, 'ALTER TABLE projects ADD COLUMN criticAnalysis TEXT', 'duplicate column name');
  runMigration(db, 'ALTER TABLE projects ADD COLUMN fdxSource TEXT', 'duplicate column name');

  db.exec(`
    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      orderIndex INTEGER NOT NULL,
      sceneHeading TEXT,
      characterName TEXT,
      originalText TEXT NOT NULL,
      rewriteText TEXT NOT NULL,
      weaknessCategory TEXT NOT NULL,
      weaknessLabel TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  runMigration(db, "ALTER TABLE suggestions ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'", 'duplicate column name');

  // Indexes for common query patterns
  db.exec('CREATE INDEX IF NOT EXISTS idx_suggestions_projectId ON suggestions(projectId, orderIndex)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_projects_updatedAt ON projects(updatedAt DESC)');

  globalDb.__filminternDb = db;
  return db;
}

// Graceful shutdown: checkpoint WAL before container stop
function shutdown(): void {
  if (globalDb.__filminternDb) {
    try {
      globalDb.__filminternDb.pragma('wal_checkpoint(TRUNCATE)');
      globalDb.__filminternDb.close();
    } catch { /* closing during exit — best effort */ }
    globalDb.__filminternDb = undefined;
  }
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export function generateId(): string {
  return randomUUID();
}

export interface ProjectRow {
  id: string;
  title: string;
  projectType: string;
  fileName: string | null;
  uploadData: string | null;
  analysisData: string | null;
  reportDocument: string | null;
  generatedDocuments: string | null;
  criticAnalysis: string | null;
  fdxSource: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionRow {
  id: string;
  projectId: string;
  orderIndex: number;
  sceneHeading: string | null;
  characterName: string | null;
  originalText: string;
  rewriteText: string;
  weaknessCategory: string;
  weaknessLabel: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export const db = {
  listProjects(): Omit<ProjectRow, 'analysisData' | 'reportDocument' | 'generatedDocuments' | 'criticAnalysis'>[] {
    const stmt = getDb().prepare(
      'SELECT id, title, projectType, fileName, createdAt, updatedAt FROM projects ORDER BY updatedAt DESC'
    );
    return stmt.all() as Omit<ProjectRow, 'analysisData' | 'reportDocument' | 'generatedDocuments' | 'criticAnalysis'>[];
  },

  createProject(data: { id: string; title: string; projectType: string; fileName?: string | null }): ProjectRow {
    const now = new Date().toISOString();
    const stmt = getDb().prepare(
      'INSERT INTO projects (id, title, projectType, fileName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(data.id, data.title, data.projectType, data.fileName ?? null, now, now);
    return this.getProject(data.id)!;
  },

  getProject(id: string): ProjectRow | null {
    const stmt = getDb().prepare('SELECT * FROM projects WHERE id = ?');
    return (stmt.get(id) as ProjectRow) ?? null;
  },

  updateProject(id: string, fields: Partial<Pick<ProjectRow, 'title' | 'uploadData' | 'analysisData' | 'reportDocument' | 'generatedDocuments' | 'criticAnalysis' | 'fdxSource'>>): ProjectRow | null {
    const now = new Date().toISOString();
    const sets: string[] = ['updatedAt = ?'];
    const values: unknown[] = [now];

    if (fields.title !== undefined) { sets.push('title = ?'); values.push(fields.title); }
    if (fields.uploadData !== undefined) { sets.push('uploadData = ?'); values.push(fields.uploadData); }
    if (fields.analysisData !== undefined) { sets.push('analysisData = ?'); values.push(fields.analysisData); }
    if (fields.reportDocument !== undefined) { sets.push('reportDocument = ?'); values.push(fields.reportDocument); }
    if (fields.generatedDocuments !== undefined) { sets.push('generatedDocuments = ?'); values.push(fields.generatedDocuments); }
    if (fields.criticAnalysis !== undefined) { sets.push('criticAnalysis = ?'); values.push(fields.criticAnalysis); }
    if (fields.fdxSource !== undefined) { sets.push('fdxSource = ?'); values.push(fields.fdxSource); }

    values.push(id);
    getDb().prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.getProject(id);
  },

  deleteProject(id: string): void {
    getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
  },

  insertSuggestion(row: Omit<SuggestionRow, 'createdAt' | 'status'> & { status?: string }): void {
    getDb().prepare(
      'INSERT INTO suggestions (id, projectId, orderIndex, sceneHeading, characterName, originalText, rewriteText, weaknessCategory, weaknessLabel, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(row.id, row.projectId, row.orderIndex, row.sceneHeading, row.characterName, row.originalText, row.rewriteText, row.weaknessCategory, row.weaknessLabel, row.status ?? 'pending');
  },

  listSuggestions(projectId: string): SuggestionRow[] {
    return getDb().prepare('SELECT * FROM suggestions WHERE projectId = ? ORDER BY orderIndex ASC').all(projectId) as SuggestionRow[];
  },

  deleteSuggestionsForProject(projectId: string): void {
    getDb().prepare('DELETE FROM suggestions WHERE projectId = ?').run(projectId);
  },

  updateSuggestionStatus(id: string, status: SuggestionRow['status']): void {
    getDb().prepare('UPDATE suggestions SET status = ? WHERE id = ?').run(status, id);
  },

  updateSuggestionRewrite(id: string, rewriteText: string): void {
    getDb().prepare("UPDATE suggestions SET rewriteText = ?, status = 'pending' WHERE id = ?").run(rewriteText, id);
  },

  getSuggestion(id: string): SuggestionRow | null {
    return (getDb().prepare('SELECT * FROM suggestions WHERE id = ?').get(id) as SuggestionRow) ?? null;
  },
};
