/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockStreamText, mockOutputObject, mockAnthropic } = vi.hoisted(() => ({
  mockStreamText: vi.fn(),
  mockOutputObject: vi.fn().mockReturnValue('mocked-output'),
  mockAnthropic: vi.fn().mockReturnValue('mock-model'),
}));

vi.mock('ai', () => ({
  streamText: mockStreamText,
  Output: { object: mockOutputObject },
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: mockAnthropic,
}));

vi.mock('zod', () => ({
  z: { ZodObject: class {} },
}));

vi.mock('@/lib/ai/schemas/documentary', () => ({
  documentaryAnalysisSchema: { _type: 'documentary-schema' },
}));

vi.mock('@/lib/ai/prompts/documentary', () => ({
  documentarySystemPrompt: 'documentary-prompt',
}));

vi.mock('@/lib/ai/schemas/corporate', () => ({
  corporateAnalysisSchema: { _type: 'corporate-schema' },
}));

vi.mock('@/lib/ai/prompts/corporate', () => ({
  corporateSystemPrompt: 'corporate-prompt',
}));

vi.mock('@/lib/ai/schemas/narrative', () => ({
  narrativeAnalysisSchema: { _type: 'narrative-schema' },
}));

vi.mock('@/lib/ai/prompts/narrative', () => ({
  narrativeSystemPrompt: 'narrative-prompt',
}));

vi.mock('@/lib/ai/schemas/tv-episodic', () => ({
  tvEpisodicAnalysisSchema: { _type: 'tv-episodic-schema' },
}));

vi.mock('@/lib/ai/prompts/tv-episodic', () => ({
  tvEpisodicSystemPrompt: 'tv-episodic-prompt',
}));

vi.mock('@/lib/ai/schemas/short-form', () => ({
  shortFormAnalysisSchema: { _type: 'short-form-schema' },
}));

vi.mock('@/lib/ai/prompts/short-form', () => ({
  shortFormSystemPrompt: 'short-form-prompt',
}));

import { POST } from '../route';

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

  it('calls streamText with documentaryAnalysisSchema for documentary projectType', async () => {
    const req = makeRequest({ text: 'sample transcript', projectType: 'documentary' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockAnthropic).toHaveBeenCalledWith('claude-sonnet-4-5');
    expect(mockOutputObject).toHaveBeenCalledWith({
      schema: { _type: 'documentary-schema' },
    });
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        output: 'mocked-output',
        system: 'documentary-prompt',
        prompt: expect.stringContaining('sample transcript'),
      })
    );
  });

  it('calls streamText with corporateAnalysisSchema for corporate projectType', async () => {
    const req = makeRequest({ text: 'sample corporate transcript', projectType: 'corporate' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockOutputObject).toHaveBeenCalledWith({
      schema: { _type: 'corporate-schema' },
    });
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'corporate-prompt',
        prompt: expect.stringContaining('sample corporate transcript'),
      })
    );
  });

  it('calls streamText with narrativeAnalysisSchema for narrative projectType', async () => {
    const req = makeRequest({ text: 'sample screenplay', projectType: 'narrative' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockOutputObject).toHaveBeenCalledWith({
      schema: { _type: 'narrative-schema' },
    });
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'narrative-prompt',
        prompt: expect.stringContaining('sample screenplay'),
      })
    );
  });

  it('calls streamText with tvEpisodicAnalysisSchema for tv-episodic projectType', async () => {
    const req = makeRequest({ text: 'sample pilot script', projectType: 'tv-episodic' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockOutputObject).toHaveBeenCalledWith({
      schema: { _type: 'tv-episodic-schema' },
    });
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'tv-episodic-prompt',
        prompt: expect.stringContaining('sample pilot script'),
      })
    );
  });

  it('calls streamText with shortFormAnalysisSchema for short-form projectType', async () => {
    const req = makeRequest({ text: 'sample brand script', projectType: 'short-form' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockOutputObject).toHaveBeenCalledWith({
      schema: { _type: 'short-form-schema' },
    });
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'short-form-prompt',
        prompt: expect.stringContaining('sample brand script'),
      })
    );
  });

  it('includes inputType in prompt for short-form projectType', async () => {
    const req = makeRequest({ text: 'sample vo script', projectType: 'short-form', inputType: 'vo-transcript' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('[Input Type: vo-transcript]'),
      })
    );
  });

  it('does not include inputType for non-short-form projectType', async () => {
    const req = makeRequest({ text: 'sample', projectType: 'documentary', inputType: 'vo-transcript' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.not.stringContaining('[Input Type:'),
      })
    );
  });

  it('returns 400 with "Unsupported project type" for unknown projectType', async () => {
    const req = makeRequest({ text: 'sample', projectType: 'unknown-type' });
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
