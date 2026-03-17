/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';

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

import { buildRegistry } from '../provider-registry';

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
