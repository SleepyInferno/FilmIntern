/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockStreamText, mockLoadSettings, mockLanguageModel, mockBuildRegistry, mockCheckProviderHealth, mockAPICallError, mockLoadAPIKeyError, mockNoSuchModelError } = vi.hoisted(() => ({
  mockStreamText: vi.fn(),
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

vi.mock('@/lib/ai/prompts/harsh-critic', () => ({
  harshCriticSystemPrompt: 'mock-critic-prompt',
}));

import { POST, maxDuration } from '../route';

const DEFAULT_MOCK_SETTINGS = {
  provider: 'anthropic' as const,
  anthropic: { model: 'claude-sonnet-4-5' },
  openai: { model: 'gpt-4o' },
  ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
};

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/analyze/critic', {
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

describe('POST /api/analyze/critic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadSettings.mockResolvedValue({ ...DEFAULT_MOCK_SETTINGS });
    mockBuildRegistry.mockReturnValue({ languageModel: mockLanguageModel });
    mockLanguageModel.mockReturnValue('mock-model');
    mockStreamText.mockReturnValue(makeStreamMock(['critic ', 'output']));
    mockCheckProviderHealth.mockResolvedValue({ ok: true });
    mockAPICallError.isInstance.mockReturnValue(false);
    mockLoadAPIKeyError.isInstance.mockReturnValue(false);
    mockNoSuchModelError.isInstance.mockReturnValue(false);
  });

  it('calls streamText with harshCriticSystemPrompt and returns 200 for valid input', async () => {
    const req = makeRequest({ text: 'sample screenplay text', projectType: 'narrative' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        system: 'mock-critic-prompt',
        prompt: expect.stringContaining('sample screenplay text'),
      })
    );
  });

  it('returns 400 with "No text provided" for empty text', async () => {
    const req = makeRequest({ text: '', projectType: 'narrative' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No text provided');
  });

  it('returns 400 with "No text provided" when text field is missing', async () => {
    const req = makeRequest({ projectType: 'narrative' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No text provided');
  });

  it('includes projectType in the prompt sent to streamText', async () => {
    const req = makeRequest({ text: 'sample text', projectType: 'documentary' });
    await POST(req);

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('documentary'),
      })
    );
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('sample text'),
      })
    );
  });

  it('returns 503 when checkProviderHealth returns {ok: false}', async () => {
    mockCheckProviderHealth.mockResolvedValue({ ok: false, error: 'API key not configured' });
    const req = makeRequest({ text: 'sample', projectType: 'narrative' });
    const res = await POST(req);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('API key not configured');
    expect(mockStreamText).not.toHaveBeenCalled();
  });

  it('exports maxDuration equal to 120', () => {
    expect(maxDuration).toBe(120);
  });

  it('calls streamText WITHOUT Output.object (plain text streaming)', async () => {
    const req = makeRequest({ text: 'sample text', projectType: 'narrative' });
    await POST(req);

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.output).toBeUndefined();
  });

  describe('error handling', () => {
    it('returns 401 when LoadAPIKeyError thrown', async () => {
      mockStreamText.mockImplementation(() => { throw new Error('key'); });
      mockLoadAPIKeyError.isInstance.mockReturnValue(true);
      const req = makeRequest({ text: 'sample', projectType: 'narrative' });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('API key');
    });

    it('returns 502 when APICallError with non-401 statusCode', async () => {
      const err = new Error('Server error');
      (err as unknown as Record<string, unknown>).statusCode = 500;
      mockStreamText.mockImplementation(() => { throw err; });
      mockAPICallError.isInstance.mockReturnValue(true);
      const req = makeRequest({ text: 'sample', projectType: 'narrative' });
      const res = await POST(req);

      expect(res.status).toBe(502);
    });

    it('returns 400 when NoSuchModelError thrown', async () => {
      mockStreamText.mockImplementation(() => { throw new Error('model not found'); });
      mockNoSuchModelError.isInstance.mockReturnValue(true);
      const req = makeRequest({ text: 'sample', projectType: 'narrative' });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 500 for unknown errors', async () => {
      mockStreamText.mockImplementation(() => { throw new Error('something weird'); });
      const req = makeRequest({ text: 'sample', projectType: 'narrative' });
      const res = await POST(req);

      expect(res.status).toBe(500);
    });
  });

  describe('NDJSON envelope', () => {
    it('emits chunk events and a terminal done event with full text', async () => {
      mockStreamText.mockReturnValue(makeStreamMock(['Harsh ', 'critique ', 'text.']));
      const req = makeRequest({ text: 'sample', projectType: 'narrative' });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/x-ndjson');

      const events = await readNdjson(res);
      const chunkEvents = events.filter((e) => e.type === 'chunk');
      const doneEvents = events.filter((e) => e.type === 'done');
      expect(chunkEvents).toHaveLength(3);
      expect(doneEvents).toHaveLength(1);
      expect(doneEvents[0].text).toBe('Harsh critique text.');
    });

    it('emits a typed error event when provider stream throws mid-stream', async () => {
      mockStreamText.mockReturnValue(makeStreamMock(async function* () {
        yield 'starting...';
        throw new Error('rate limit hit');
      }));
      const req = makeRequest({ text: 'sample', projectType: 'narrative' });
      const res = await POST(req);

      const events = await readNdjson(res);
      const errorEvents = events.filter((e) => e.type === 'error');
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].message).toContain('rate limit hit');
    });

    it('emits an error event when the stream produces no data', async () => {
      mockStreamText.mockReturnValue(makeStreamMock([]));
      const req = makeRequest({ text: 'sample', projectType: 'narrative' });
      const res = await POST(req);

      const events = await readNdjson(res);
      const errorEvents = events.filter((e) => e.type === 'error');
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].message).toMatch(/no data/i);
    });
  });
});
