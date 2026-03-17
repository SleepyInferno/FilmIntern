/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';

const { mockCreateProviderRegistry, mockAnthropic, mockOpenai, mockCreateOllama, mockOllamaInstance } = vi.hoisted(() => ({
  mockCreateProviderRegistry: vi.fn().mockReturnValue({ languageModel: vi.fn() }),
  mockAnthropic: vi.fn().mockReturnValue('anthropic-model'),
  mockOpenai: vi.fn().mockReturnValue('openai-model'),
  mockCreateOllama: vi.fn().mockReturnValue('ollama-provider'),
  mockOllamaInstance: 'ollama-provider',
}));

vi.mock('ai', () => ({
  createProviderRegistry: mockCreateProviderRegistry,
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: mockAnthropic,
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: mockOpenai,
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
      anthropic: mockAnthropic,
      openai: mockOpenai,
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
