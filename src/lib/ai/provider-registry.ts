import { createProviderRegistry } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider-v2';

export function buildRegistry(ollamaBaseURL?: string) {
  return createProviderRegistry({
    anthropic,
    openai,
    ollama: createOllama({
      baseURL: ollamaBaseURL || 'http://localhost:11434/api',
    }),
  });
}
