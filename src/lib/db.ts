import Database from 'better-sqlite3';
import path from 'path';

export const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'dev.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      projectType TEXT NOT NULL,
      fileName TEXT,
      uploadData TEXT,
      analysisData TEXT,
      reportDocument TEXT,
      generatedDocuments TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  // Migration: add uploadData column to existing databases
  try { _db.exec('ALTER TABLE projects ADD COLUMN uploadData TEXT'); } catch { /* already exists */ }
  // Migration: add criticAnalysis column for harsh critic mode
  try { _db.exec('ALTER TABLE projects ADD COLUMN criticAnalysis TEXT'); } catch { /* already exists */ }
  return _db;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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
  createdAt: string;
  updatedAt: string;
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

  updateProject(id: string, fields: Partial<Pick<ProjectRow, 'title' | 'uploadData' | 'analysisData' | 'reportDocument' | 'generatedDocuments' | 'criticAnalysis'>>): ProjectRow | null {
    const now = new Date().toISOString();
    const sets: string[] = ['updatedAt = ?'];
    const values: unknown[] = [now];

    if (fields.title !== undefined) { sets.push('title = ?'); values.push(fields.title); }
    if (fields.uploadData !== undefined) { sets.push('uploadData = ?'); values.push(fields.uploadData); }
    if (fields.analysisData !== undefined) { sets.push('analysisData = ?'); values.push(fields.analysisData); }
    if (fields.reportDocument !== undefined) { sets.push('reportDocument = ?'); values.push(fields.reportDocument); }
    if (fields.generatedDocuments !== undefined) { sets.push('generatedDocuments = ?'); values.push(fields.generatedDocuments); }
    if (fields.criticAnalysis !== undefined) { sets.push('criticAnalysis = ?'); values.push(fields.criticAnalysis); }

    values.push(id);
    getDb().prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.getProject(id);
  },

  deleteProject(id: string): void {
    getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
  },
};
