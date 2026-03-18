/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGenerateDocument } = vi.hoisted(() => ({
  mockGenerateDocument: vi.fn(),
}));

vi.mock('@/lib/documents/generators', () => ({
  generateDocument: mockGenerateDocument,
}));

import { POST } from '../route';
import type { GeneratedDocument } from '@/lib/documents/types';

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/documents/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const basePayload = {
  projectType: 'documentary',
  documentKind: 'proposal',
  sourceText: 'Sample transcript text for testing.',
  title: 'Test Documentary',
  writtenBy: 'Test Author',
  analysis: { summary: { overview: 'A test documentary.' } },
};

const mockDocument: GeneratedDocument = {
  id: 'test-uuid',
  kind: 'proposal',
  projectType: 'documentary',
  title: 'Test Documentary',
  writtenBy: 'Test Author',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  cover: {
    title: 'Test Documentary',
    typeLabel: 'Strategic Proposal',
    writtenBy: 'Test Author',
    dateLabel: '2026-01-01T00:00:00.000Z',
    projectTypeLabel: 'Documentary',
  },
  content: { type: 'doc', content: [] },
  quoteRefs: [],
  sourceText: 'Sample transcript text for testing.',
  analysisSnapshot: { summary: { overview: 'A test documentary.' } },
};

describe('POST /api/documents/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateDocument.mockResolvedValue(mockDocument);
  });

  it('rejects unknown project types with status 400', async () => {
    const req = makeRequest({ ...basePayload, projectType: 'unknown-type' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Unsupported project type');
  });

  it('rejects disallowed document kinds with status 400', async () => {
    const req = makeRequest({
      ...basePayload,
      projectType: 'documentary',
      documentKind: 'treatment',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Document kind not available for project type');
  });

  it('accepts documentary proposal and returns a GeneratedDocument', async () => {
    const req = makeRequest(basePayload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('kind', 'proposal');
    expect(json).toHaveProperty('projectType', 'documentary');
    expect(json).toHaveProperty('content');
    expect(json).toHaveProperty('quoteRefs');
  });

  it('accepts narrative outline with scene-by-scene mode', async () => {
    const narrativeDoc: GeneratedDocument = {
      ...mockDocument,
      kind: 'outline',
      projectType: 'narrative',
      outlineMode: 'scene-by-scene',
    };
    mockGenerateDocument.mockResolvedValue(narrativeDoc);

    const req = makeRequest({
      projectType: 'narrative',
      documentKind: 'outline',
      outlineMode: 'scene-by-scene',
      sourceText: 'A screenplay about testing.',
      title: 'Test Screenplay',
      writtenBy: 'Test Author',
      analysis: { storyStructure: {} },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.outlineMode).toBe('scene-by-scene');
  });

  it('rejects scene-by-scene outline mode for documentary', async () => {
    const req = makeRequest({
      ...basePayload,
      documentKind: 'outline',
      outlineMode: 'scene-by-scene',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Outline mode not allowed for project type');
  });
});
