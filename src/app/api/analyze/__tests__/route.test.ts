/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockStreamText, mockOutputObject, mockLoadSettings, mockLanguageModel, mockBuildRegistry, mockCheckProviderHealth, mockAPICallError, mockLoadAPIKeyError, mockNoSuchModelError } = vi.hoisted(() => ({
  mockStreamText: vi.fn(),
  mockOutputObject: vi.fn().mockReturnValue('mocked-output'),
  mockLoadSettings: vi.fn(),
  mockLanguageModel: vi.fn().mockReturnValue('mock-model'),
  mockBuildRegistry: vi.fn(),
  mockCheckProviderHealth: vi.fn().mockResolvedValue({ ok: true }),
  mockAPICallError: { isInstance: vi.fn().mockReturnValue(false) },
  mockLoadAPIKeyError: { isInstance: vi.fn().mockReturnValue(false) },
  mockNoSuchModelError: { isInstance: vi.fn().mockReturnValue(false) },
}));

// Initialize mockBuildRegistry to return an object with languageModel
mockBuildRegistry.mockReturnValue({ languageModel: mockLanguageModel });

vi.mock('ai', () => ({
  streamText: mockStreamText,
  Output: { object: mockOutputObject },
  APICallError: mockAPICallError,
  LoadAPIKeyError: mockLoadAPIKeyError,
  NoSuchModelError: mockNoSuchModelError,
}));

vi.mock('@/lib/ai/settings', () => ({
  loadSettings: mockLoadSettings,
}));

vi.mock('@/lib/ai/provider-registry', () => ({
  buildRegistry: mockBuildRegistry,
  getModelForSettings: (settings: {
    provider: 'anthropic' | 'openai' | 'ollama';
    anthropic: { model: string };
    openai: { model: string };
    ollama: { model: string; baseURL: string };
  }) => {
    const registry = mockBuildRegistry(
      settings.ollama.baseURL,
      undefined,
      undefined,
    );
    const modelId = ({
      anthropic: `anthropic:${settings.anthropic.model}`,
      openai: `openai:${settings.openai.model}`,
      ollama: `ollama:${settings.ollama.model}`,
    } as const)[settings.provider];
    return { registry, modelId };
  },
  checkProviderHealth: mockCheckProviderHealth,
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

function makeStreamMock(chunks: string[] | (() => AsyncIterable<string>)) {
  const iterable = typeof chunks === 'function' ? chunks() : (async function* () {
    for (const c of chunks) yield c;
  })();
  return { textStream: iterable };
}

async function readNdjson(res: Response): Promise<Array<Record<string, unknown>>> {
  const text = await res.text();
  return text
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l));
}

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadSettings.mockResolvedValue({ ...DEFAULT_MOCK_SETTINGS });
    mockBuildRegistry.mockReturnValue({ languageModel: mockLanguageModel });
    mockLanguageModel.mockReturnValue('mock-model');
    mockStreamText.mockReturnValue(makeStreamMock(['{"valid":', '"json"}']));
    mockCheckProviderHealth.mockResolvedValue({ ok: true });
    mockAPICallError.isInstance.mockReturnValue(false);
    mockLoadAPIKeyError.isInstance.mockReturnValue(false);
    mockNoSuchModelError.isInstance.mockReturnValue(false);
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
    expect(mockBuildRegistry).toHaveBeenCalledWith('http://localhost:11434/api', undefined, undefined);
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

  describe('error handling', () => {
    it('returns 503 when health check fails', async () => {
      mockCheckProviderHealth.mockResolvedValue({ ok: false, error: 'Anthropic API key not configured' });
      const req = makeRequest({ text: 'sample', projectType: 'documentary' });
      const res = await POST(req);

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toContain('Anthropic API key not configured');
      expect(mockStreamText).not.toHaveBeenCalled();
    });

    it('returns 401 when LoadAPIKeyError thrown', async () => {
      mockStreamText.mockImplementation(() => { throw new Error('key'); });
      mockLoadAPIKeyError.isInstance.mockReturnValue(true);
      const req = makeRequest({ text: 'sample', projectType: 'documentary' });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('API key');
      expect(body.error).toContain('anthropic');
    });

    it('returns 401 when APICallError with statusCode 401', async () => {
      const err = new Error('Unauthorized');
      (err as unknown as Record<string, unknown>).statusCode = 401;
      mockStreamText.mockImplementation(() => { throw err; });
      mockAPICallError.isInstance.mockReturnValue(true);
      const req = makeRequest({ text: 'sample', projectType: 'documentary' });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('Invalid API key');
    });

    it('returns 502 when APICallError with other statusCode', async () => {
      const err = new Error('Server error');
      (err as unknown as Record<string, unknown>).statusCode = 500;
      mockStreamText.mockImplementation(() => { throw err; });
      mockAPICallError.isInstance.mockReturnValue(true);
      const req = makeRequest({ text: 'sample', projectType: 'documentary' });
      const res = await POST(req);

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toContain('anthropic');
    });

    it('returns 400 when NoSuchModelError thrown', async () => {
      mockStreamText.mockImplementation(() => { throw new Error('model not found'); });
      mockNoSuchModelError.isInstance.mockReturnValue(true);
      const req = makeRequest({ text: 'sample', projectType: 'documentary' });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('not found');
    });

    it('returns 500 for unknown errors', async () => {
      mockStreamText.mockImplementation(() => { throw new Error('something weird'); });
      const req = makeRequest({ text: 'sample', projectType: 'documentary' });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Analysis failed. Check provider settings and try again.');
    });
  });

  describe('NDJSON envelope', () => {
    it('emits chunk events and a terminal done event on success', async () => {
      mockStreamText.mockReturnValue(makeStreamMock(['{"a":', '1,', '"b":2}']));
      const req = makeRequest({ text: 'sample', projectType: 'documentary' });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');

      const events = await readNdjson(res);
      const chunkEvents = events.filter((e) => e.type === 'chunk');
      const doneEvents = events.filter((e) => e.type === 'done');

      expect(chunkEvents.length).toBeGreaterThan(0);
      expect(doneEvents).toHaveLength(1);
      expect(doneEvents[0].data).toEqual({ a: 1, b: 2 });
    });

    it('emits a typed error event when provider stream throws mid-stream', async () => {
      // This is the silent-stream-failure bug: mid-stream provider errors
      // must surface to the client, not get swallowed in onError.
      mockStreamText.mockReturnValue(makeStreamMock(async function* () {
        yield '{"partial":';
        throw new Error('provider exploded');
      }));
      const req = makeRequest({ text: 'sample', projectType: 'documentary' });
      const res = await POST(req);

      expect(res.status).toBe(200); // headers already sent by the time error fires
      const events = await readNdjson(res);
      const errorEvents = events.filter((e) => e.type === 'error');
      const doneEvents = events.filter((e) => e.type === 'done');

      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].message).toContain('provider exploded');
      expect(doneEvents).toHaveLength(0);
    });

    it('emits an error event when the stream produces no data', async () => {
      mockStreamText.mockReturnValue(makeStreamMock([]));
      const req = makeRequest({ text: 'sample', projectType: 'documentary' });
      const res = await POST(req);

      const events = await readNdjson(res);
      const errorEvents = events.filter((e) => e.type === 'error');
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].message).toMatch(/no data/i);
    });

    it('emits an error event when accumulated text is not valid JSON', async () => {
      mockStreamText.mockReturnValue(makeStreamMock(['not json at all']));
      const req = makeRequest({ text: 'sample', projectType: 'documentary' });
      const res = await POST(req);

      const events = await readNdjson(res);
      const errorEvents = events.filter((e) => e.type === 'error');
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].message).toMatch(/malformed/i);
    });
  });
});
