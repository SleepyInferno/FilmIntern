/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const { mockCreateProviderRegistry, mockCreateAnthropic, mockCreateOpenAI, mockCreateOllama } = vi.hoisted(() => ({
  mockCreateProviderRegistry: vi.fn().mockReturnValue({ languageModel: vi.fn() }),
  mockCreateAnthropic: vi.fn().mockReturnValue('anthropic-provider'),
  mockCreateOpenAI: vi.fn().mockReturnValue('openai-provider'),
  mockCreateOllama: vi.fn().mockReturnValue('ollama-provider'),
}));

vi.mock('ai', () => ({
  createProviderRegistry: mockCreateProviderRegistry,
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: mockCreateAnthropic,
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: mockCreateOpenAI,
}));

vi.mock('ollama-ai-provider-v2', () => ({
  createOllama: mockCreateOllama,
}));

import { buildRegistry, checkProviderHealth } from '../provider-registry';
import type { AISettings } from '../settings';

describe('provider-registry', () => {
  it('returns a registry with languageModel method', () => {
    const registry = buildRegistry();
    expect(registry).toBeDefined();
    expect(registry.languageModel).toBeDefined();
  });

  it('calls createProviderRegistry with anthropic, openai, and ollama', () => {
    buildRegistry();
    expect(mockCreateProviderRegistry).toHaveBeenCalledWith({
      anthropic: 'anthropic-provider',
      openai: 'openai-provider',
      ollama: 'ollama-provider',
    });
  });

  it('passes default baseURL to createOllama when no custom URL given', () => {
    buildRegistry();
    expect(mockCreateOllama).toHaveBeenCalledWith({
      baseURL: 'http://localhost:11434/api',
    });
  });

  it('passes custom baseURL to createOllama', () => {
    buildRegistry('http://custom:1234/api');
    expect(mockCreateOllama).toHaveBeenCalledWith({
      baseURL: 'http://custom:1234/api',
    });
  });
});

function makeSettings(overrides: Partial<AISettings> = {}): AISettings {
  return {
    provider: 'anthropic',
    anthropic: { model: 'claude-sonnet-4-5', apiKey: 'sk-ant-xxx' },
    openai: { model: 'gpt-4o', apiKey: 'sk-xxx' },
    ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
    ...overrides,
  };
}

describe('checkProviderHealth', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok:false when Anthropic API key is empty', async () => {
    const settings = makeSettings({
      provider: 'anthropic',
      anthropic: { model: 'claude-sonnet-4-5', apiKey: '' },
    });
    const result = await checkProviderHealth(settings);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Anthropic API key not configured');
  });

  it('returns ok:true when Anthropic API key is present', async () => {
    const settings = makeSettings({
      provider: 'anthropic',
      anthropic: { model: 'claude-sonnet-4-5', apiKey: 'sk-ant-xxx' },
    });
    const result = await checkProviderHealth(settings);
    expect(result.ok).toBe(true);
  });

  it('returns ok:false when OpenAI API key is empty', async () => {
    const settings = makeSettings({
      provider: 'openai',
      openai: { model: 'gpt-4o', apiKey: '' },
    });
    const result = await checkProviderHealth(settings);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('OpenAI API key not configured');
  });

  it('returns ok:true when OpenAI API key is present', async () => {
    const settings = makeSettings({
      provider: 'openai',
      openai: { model: 'gpt-4o', apiKey: 'sk-xxx' },
    });
    const result = await checkProviderHealth(settings);
    expect(result.ok).toBe(true);
  });

  it('returns ok:false when Ollama server is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    const settings = makeSettings({
      provider: 'ollama',
      ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
    });
    const result = await checkProviderHealth(settings);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Cannot reach Ollama');
  });

  it('returns ok:true when Ollama server is reachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const settings = makeSettings({
      provider: 'ollama',
      ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
    });
    const result = await checkProviderHealth(settings);
    expect(result.ok).toBe(true);
  });
});
