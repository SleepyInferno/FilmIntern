import { describe, it } from 'vitest';

describe('suggestions - DB CRUD (SUGG-06)', () => {
  it.todo('insertSuggestion creates a row and listSuggestions returns it');
  it.todo('listSuggestions returns suggestions ordered by orderIndex ASC');
  it.todo('deleteSuggestionsForProject removes all suggestions for a project');
  it.todo('suggestions table has all required columns (id, projectId, orderIndex, sceneHeading, characterName, originalText, rewriteText, weaknessCategory, weaknessLabel, createdAt)');
});

describe('suggestions - weakness extraction (SUGG-02, SUGG-05)', () => {
  it.todo('extractWeaknesses returns WeaknessTarget[] for narrative analysis data');
  it.todo('extractWeaknesses returns WeaknessTarget[] for tv-episodic analysis data');
  it.todo('extractWeaknesses returns WeaknessTarget[] for documentary analysis data');
  it.todo('extractWeaknesses returns WeaknessTarget[] for corporate analysis data');
  it.todo('extractWeaknesses returns empty array for unknown project type');
  it.todo('extractWeaknesses handles missing/null weakness fields gracefully');
});

describe('suggestions - suggestion config (SUGG-05)', () => {
  it.todo('suggestionConfig has entries for all 4 project types');
  it.todo('each config entry has a prompt string');
});

describe('suggestions - fdxSource column (SUGG-06)', () => {
  it.todo('fdxSource column exists on projects table and accepts TEXT');
  it.todo('updateProject can set fdxSource field');
});
