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

describe('POST /api/analyze/critic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadSettings.mockResolvedValue({ ...DEFAULT_MOCK_SETTINGS });
    mockBuildRegistry.mockReturnValue({ languageModel: mockLanguageModel });
    mockLanguageModel.mockReturnValue('mock-model');
    mockStreamText.mockReturnValue({
      toTextStreamResponse: vi.fn().mockReturnValue(new Response('critic output')),
    });
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
});
