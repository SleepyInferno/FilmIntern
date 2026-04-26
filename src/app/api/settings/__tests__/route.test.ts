/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockLoadSettings, mockSaveSettings } = vi.hoisted(() => ({
  mockLoadSettings: vi.fn(),
  mockSaveSettings: vi.fn(),
}));

vi.mock('@/lib/ai/settings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/settings')>();
  return {
    ...actual,
    loadSettings: mockLoadSettings,
    saveSettings: mockSaveSettings,
  };
});

import { GET, PUT } from '../route';

const validSettings = {
  provider: 'anthropic',
  anthropic: { model: 'claude-sonnet-4-5', apiKey: '' },
  openai: { model: 'gpt-4o', apiKey: '' },
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

  it('masks API keys before returning to clients', async () => {
    mockLoadSettings.mockResolvedValue({
      ...validSettings,
      anthropic: { model: 'claude-sonnet-4-5', apiKey: 'sk-ant-1234567890abcdef' },
      openai: { model: 'gpt-4o', apiKey: 'sk-proj-abcdefghijklmnop' },
    });

    const res = await GET();
    const body = await res.json();
    expect(body.anthropic.apiKey).not.toContain('1234567890');
    expect(body.anthropic.apiKey).toMatch(/\.\.\./);
    expect(body.openai.apiKey).not.toContain('abcdefghijklmnop');
    expect(body.openai.apiKey).toMatch(/\.\.\./);
  });
});

describe('PUT /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveSettings.mockResolvedValue(undefined);
    mockLoadSettings.mockResolvedValue(validSettings);
  });

  it('saves valid settings and returns { ok: true }', async () => {
    const req = makePutRequest(validSettings);
    const res = await PUT(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockSaveSettings).toHaveBeenCalledWith(validSettings);
  });

  it('preserves stored keys when client sends masked echoes', async () => {
    mockLoadSettings.mockResolvedValue({
      ...validSettings,
      anthropic: { model: 'claude-sonnet-4-5', apiKey: 'sk-ant-real-key-1234' },
      openai: { model: 'gpt-4o', apiKey: 'sk-proj-real-key-abcd' },
    });

    const req = makePutRequest({
      ...validSettings,
      anthropic: { model: 'claude-sonnet-4-5', apiKey: 'sk-a...1234' },
      openai: { model: 'gpt-4o', apiKey: '' },
    });
    const res = await PUT(req);

    expect(res.status).toBe(200);
    const saved = mockSaveSettings.mock.calls[0][0];
    expect(saved.anthropic.apiKey).toBe('sk-ant-real-key-1234');
    expect(saved.openai.apiKey).toBe('sk-proj-real-key-abcd');
  });

  it('overwrites stored key when client supplies a fresh value', async () => {
    mockLoadSettings.mockResolvedValue({
      ...validSettings,
      anthropic: { model: 'claude-sonnet-4-5', apiKey: 'old-key' },
    });

    const req = makePutRequest({
      ...validSettings,
      anthropic: { model: 'claude-sonnet-4-5', apiKey: 'sk-ant-brand-new-value' },
    });
    await PUT(req);
    const saved = mockSaveSettings.mock.calls[0][0];
    expect(saved.anthropic.apiKey).toBe('sk-ant-brand-new-value');
  });

  it('accepts a LAN baseURL (e.g. http://192.168.1.9:11434/api)', async () => {
    const req = makePutRequest({
      ...validSettings,
      ollama: { model: 'llama3.1', baseURL: 'http://192.168.1.9:11434/api' },
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
  });

  it('rejects baseURL with link-local/metadata host', async () => {
    const req = makePutRequest({
      ...validSettings,
      ollama: { model: 'llama3.1', baseURL: 'http://169.254.169.254/latest/meta-data/' },
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/link-local|metadata/i);
  });

  it('rejects baseURL with non-http scheme', async () => {
    const req = makePutRequest({
      ...validSettings,
      ollama: { model: 'llama3.1', baseURL: 'file:///etc/passwd' },
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('rejects baseURL containing credentials', async () => {
    const req = makePutRequest({
      ...validSettings,
      ollama: { model: 'llama3.1', baseURL: 'http://user:pass@example.com/api' },
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
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
