/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockLoadSettings, mockSaveSettings } = vi.hoisted(() => ({
  mockLoadSettings: vi.fn(),
  mockSaveSettings: vi.fn(),
}));

vi.mock('@/lib/ai/settings', () => ({
  loadSettings: mockLoadSettings,
  saveSettings: mockSaveSettings,
}));

import { GET, PUT } from '../route';

const validSettings = {
  provider: 'anthropic',
  anthropic: { model: 'claude-sonnet-4-5' },
  openai: { model: 'gpt-4o' },
  ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
};

function makePutRequest(body: unknown): Request {
  return new Request('http://localhost/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with current settings', async () => {
    mockLoadSettings.mockResolvedValue(validSettings);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.provider).toBe('anthropic');
    expect(body.anthropic.model).toBe('claude-sonnet-4-5');
    expect(body.openai.model).toBe('gpt-4o');
    expect(body.ollama.model).toBe('llama3.1');
  });
});

describe('PUT /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveSettings.mockResolvedValue(undefined);
  });

  it('saves valid settings and returns { ok: true }', async () => {
    const req = makePutRequest(validSettings);
    const res = await PUT(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockSaveSettings).toHaveBeenCalledWith(validSettings);
  });

  it('returns 400 when provider is missing', async () => {
    const req = makePutRequest({
      anthropic: { model: 'claude-sonnet-4-5' },
      openai: { model: 'gpt-4o' },
      ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 400 when provider is invalid value', async () => {
    const req = makePutRequest({
      ...validSettings,
      provider: 'gemini',
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid provider');
  });

  it('returns 400 when provider config fields are missing', async () => {
    const req = makePutRequest({
      provider: 'anthropic',
      anthropic: { model: 'claude-sonnet-4-5' },
      // missing openai and ollama
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('persists settings that can be read back via GET', async () => {
    const openaiSettings = {
      ...validSettings,
      provider: 'openai',
    };
    mockSaveSettings.mockResolvedValue(undefined);
    mockLoadSettings.mockResolvedValue(openaiSettings);

    const putReq = makePutRequest(openaiSettings);
    const putRes = await PUT(putReq);
    expect(putRes.status).toBe(200);

    const getRes = await GET();
    const body = await getRes.json();
    expect(body.provider).toBe('openai');
  });
});
