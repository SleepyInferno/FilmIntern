import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock generateObject from ai SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

// Mock db module
vi.mock('@/lib/db', () => ({
  db: {
    getProject: vi.fn(),
    getSuggestion: vi.fn(),
    updateSuggestionRewrite: vi.fn(),
  },
}));

// Mock AI settings and provider registry
vi.mock('@/lib/ai/settings', () => ({
  loadSettings: vi.fn(),
}));

vi.mock('@/lib/ai/provider-registry', () => ({
  buildRegistry: vi.fn(() => ({
    languageModel: vi.fn(),
  })),
  checkProviderHealth: vi.fn(),
}));

describe('POST /api/projects/[id]/suggestions/[suggestionId]/regenerate (REVW-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when project does not exist', async () => {
    const { db } = await import('@/lib/db');
    (db.getProject as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { POST } = await import('@/app/api/projects/[id]/suggestions/[suggestionId]/regenerate/route');
    const req = new Request('http://localhost/api/projects/abc/suggestions/def/regenerate', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'abc', suggestionId: 'def' }) });
    expect(res.status).toBe(404);
  });

  it('returns 404 when suggestion does not exist', async () => {
    const { db } = await import('@/lib/db');
    (db.getProject as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'abc', projectType: 'narrative' });
    (db.getSuggestion as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { POST } = await import('@/app/api/projects/[id]/suggestions/[suggestionId]/regenerate/route');
    const req = new Request('http://localhost/api/projects/abc/suggestions/def/regenerate', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'abc', suggestionId: 'def' }) });
    expect(res.status).toBe(404);
  });

  it('calls generateObject and returns updated suggestion row on success', async () => {
    const { db } = await import('@/lib/db');
    const { generateObject } = await import('ai');
    const { loadSettings } = await import('@/lib/ai/settings');
    const { checkProviderHealth } = await import('@/lib/ai/provider-registry');

    const mockSuggestion = {
      id: 'def',
      projectId: 'abc',
      orderIndex: 0,
      sceneHeading: null,
      characterName: null,
      originalText: 'original line',
      rewriteText: 'old rewrite',
      weaknessCategory: 'dialogue',
      weaknessLabel: 'flat dialogue',
      status: 'pending',
      createdAt: '2026-01-01',
    };
    const updatedSuggestion = { ...mockSuggestion, rewriteText: 'new rewrite', status: 'pending' };

    (db.getProject as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'abc',
      projectType: 'narrative',
      uploadData: JSON.stringify({ text: 'script text' }),
      analysisData: null,
    });
    (db.getSuggestion as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(mockSuggestion)  // first call: validation
      .mockReturnValueOnce(updatedSuggestion);  // second call: return updated
    (loadSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
      provider: 'ollama',
      ollama: { baseURL: 'http://localhost:11434', model: 'test' },
      anthropic: { apiKey: '', model: '' },
      openai: { apiKey: '', model: '' },
    });
    (checkProviderHealth as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: { rewriteText: 'new rewrite', sceneHeading: null, characterName: null, originalText: 'original line' },
    });

    const { POST } = await import('@/app/api/projects/[id]/suggestions/[suggestionId]/regenerate/route');
    const req = new Request('http://localhost/api/projects/abc/suggestions/def/regenerate', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'abc', suggestionId: 'def' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rewriteText).toBe('new rewrite');
    expect(db.updateSuggestionRewrite).toHaveBeenCalledWith('def', 'new rewrite');
  });
});
