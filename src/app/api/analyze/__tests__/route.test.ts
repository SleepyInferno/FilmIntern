/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockStreamText, mockOutputObject, mockLoadSettings, mockLanguageModel, mockBuildRegistry } = vi.hoisted(() => ({
  mockStreamText: vi.fn(),
  mockOutputObject: vi.fn().mockReturnValue('mocked-output'),
  mockLoadSettings: vi.fn(),
  mockLanguageModel: vi.fn().mockReturnValue('mock-model'),
  mockBuildRegistry: vi.fn(),
}));

// Initialize mockBuildRegistry to return an object with languageModel
mockBuildRegistry.mockReturnValue({ languageModel: mockLanguageModel });

vi.mock('ai', () => ({
  streamText: mockStreamText,
  Output: { object: mockOutputObject },
}));

vi.mock('@/lib/ai/settings', () => ({
  loadSettings: mockLoadSettings,
}));

vi.mock('@/lib/ai/provider-registry', () => ({
  buildRegistry: mockBuildRegistry,
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

const DEFAULT_MOCK_SETTINGS = {
  provider: 'anthropic' as const,
  anthropic: { model: 'claude-sonnet-4-5' },
  openai: { model: 'gpt-4o' },
  ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
};

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
    mockLoadSettings.mockResolvedValue({ ...DEFAULT_MOCK_SETTINGS });
    mockBuildRegistry.mockReturnValue({ languageModel: mockLanguageModel });
    mockLanguageModel.mockReturnValue('mock-model');
    mockStreamText.mockReturnValue({
      toTextStreamResponse: vi.fn().mockReturnValue(new Response('{}')),
    });
  });

  it('calls streamText with documentaryAnalysisSchema for documentary projectType', async () => {
    const req = makeRequest({ text: 'sample transcript', projectType: 'documentary' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockLanguageModel).toHaveBeenCalledWith('anthropic:claude-sonnet-4-5');
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

  it('includes anthropic providerOptions when provider is anthropic', async () => {
    const req = makeRequest({ text: 'sample transcript', projectType: 'documentary' });
    await POST(req);

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: {
          anthropic: { structuredOutputMode: 'auto' },
        },
      })
    );
  });

  it('uses openai provider when settings.provider is openai', async () => {
    mockLoadSettings.mockResolvedValue({
      ...DEFAULT_MOCK_SETTINGS,
      provider: 'openai',
    });

    const req = makeRequest({ text: 'sample transcript', projectType: 'documentary' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockLanguageModel).toHaveBeenCalledWith('openai:gpt-4o');
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.not.objectContaining({
        providerOptions: expect.anything(),
      })
    );
  });

  it('uses ollama provider when settings.provider is ollama', async () => {
    mockLoadSettings.mockResolvedValue({
      ...DEFAULT_MOCK_SETTINGS,
      provider: 'ollama',
    });

    const req = makeRequest({ text: 'sample transcript', projectType: 'documentary' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockLanguageModel).toHaveBeenCalledWith('ollama:llama3.1');
    expect(mockBuildRegistry).toHaveBeenCalledWith('http://localhost:11434/api');
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.not.objectContaining({
        providerOptions: expect.anything(),
      })
    );
  });

  it('defaults to anthropic when loadSettings returns default', async () => {
    const req = makeRequest({ text: 'sample transcript', projectType: 'documentary' });
    await POST(req);

    expect(mockLanguageModel).toHaveBeenCalledWith('anthropic:claude-sonnet-4-5');
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
