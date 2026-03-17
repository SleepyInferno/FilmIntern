import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the 'ai' module
const mockStreamText = vi.fn();
const mockOutputObject = vi.fn().mockReturnValue('mocked-output');

vi.mock('ai', () => ({
  streamText: mockStreamText,
  Output: { object: mockOutputObject },
}));

// Mock the anthropic provider
const mockAnthropic = vi.fn().mockReturnValue('mock-model');
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: mockAnthropic,
}));

// Mock the schema and prompt
vi.mock('@/lib/ai/schemas/documentary', () => ({
  documentaryAnalysisSchema: { _type: 'mock-schema' },
}));

vi.mock('@/lib/ai/prompts/documentary', () => ({
  documentarySystemPrompt: 'mock-system-prompt',
}));

import { POST } from '../../route';

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStreamText.mockReturnValue({
      toTextStreamResponse: vi.fn().mockReturnValue(new Response('{}')),
    });
  });

  it('calls streamText with documentaryAnalysisSchema and documentarySystemPrompt for valid input', async () => {
    const req = makeRequest({ text: 'sample transcript', projectType: 'documentary' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockAnthropic).toHaveBeenCalledWith('claude-sonnet-4-5');
    expect(mockOutputObject).toHaveBeenCalledWith({
      schema: { _type: 'mock-schema' },
    });
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        output: 'mocked-output',
        system: 'mock-system-prompt',
        prompt: expect.stringContaining('sample transcript'),
      })
    );
  });

  it('returns 400 with "Unsupported project type" for non-documentary projectType', async () => {
    const req = makeRequest({ text: 'sample', projectType: 'narrative' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain('Unsupported project type');
  });

  it('returns 400 with "No text provided" for empty text', async () => {
    const req = makeRequest({ text: '', projectType: 'documentary' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain('No text provided');
  });

  it('returns 400 with "No text provided" when text field is missing', async () => {
    const req = makeRequest({ projectType: 'documentary' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain('No text provided');
  });
});
