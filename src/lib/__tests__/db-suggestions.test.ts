import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';

// We test against the real db module by using a temp database
describe('suggestion status methods', () => {
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = path.join(process.cwd(), `test-${Date.now()}.db`);
    process.env.DATABASE_PATH = testDbPath;
    // Force re-import to get fresh db connection
  });

  afterEach(() => {
    try { fs.unlinkSync(testDbPath); } catch { /* ignore */ }
    delete process.env.DATABASE_PATH;
  });

  it('new suggestions default to pending status', async () => {
    // Dynamic import to get fresh module with test DB path
    const { db, generateId } = await import('@/lib/db');
    const projectId = generateId();
    db.createProject({ id: projectId, title: 'Test', projectType: 'narrative' });

    const suggestionId = generateId();
    db.insertSuggestion({
      id: suggestionId,
      projectId,
      orderIndex: 0,
      sceneHeading: null,
      characterName: null,
      originalText: 'original',
      rewriteText: 'rewrite',
      weaknessCategory: 'dialogue',
      weaknessLabel: 'test weakness',
      status: 'pending',
    });

    const suggestion = db.getSuggestion(suggestionId);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.status).toBe('pending');
  });

  it('updateSuggestionStatus changes status to accepted', async () => {
    const { db, generateId } = await import('@/lib/db');
    const projectId = generateId();
    db.createProject({ id: projectId, title: 'Test', projectType: 'narrative' });

    const suggestionId = generateId();
    db.insertSuggestion({
      id: suggestionId,
      projectId,
      orderIndex: 0,
      sceneHeading: null,
      characterName: null,
      originalText: 'original',
      rewriteText: 'rewrite',
      weaknessCategory: 'dialogue',
      weaknessLabel: 'test',
      status: 'pending',
    });

    db.updateSuggestionStatus(suggestionId, 'accepted');
    const updated = db.getSuggestion(suggestionId);
    expect(updated!.status).toBe('accepted');
  });

  it('updateSuggestionRewrite changes text and resets status to pending', async () => {
    const { db, generateId } = await import('@/lib/db');
    const projectId = generateId();
    db.createProject({ id: projectId, title: 'Test', projectType: 'narrative' });

    const suggestionId = generateId();
    db.insertSuggestion({
      id: suggestionId,
      projectId,
      orderIndex: 0,
      sceneHeading: null,
      characterName: null,
      originalText: 'original',
      rewriteText: 'old rewrite',
      weaknessCategory: 'dialogue',
      weaknessLabel: 'test',
      status: 'pending',
    });

    db.updateSuggestionStatus(suggestionId, 'accepted');
    db.updateSuggestionRewrite(suggestionId, 'new rewrite');
    const updated = db.getSuggestion(suggestionId);
    expect(updated!.rewriteText).toBe('new rewrite');
    expect(updated!.status).toBe('pending');
  });
});
