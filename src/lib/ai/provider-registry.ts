import { createProviderRegistry } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider-v2';

export function buildRegistry(ollamaBaseURL?: string, anthropicApiKey?: string, openaiApiKey?: string) {
  return createProviderRegistry({
    anthropic: createAnthropic({
      ...(anthropicApiKey ? { apiKey: anthropicApiKey } : {}),
    }),
    openai: createOpenAI({
      ...(openaiApiKey ? { apiKey: openaiApiKey } : {}),
    }),
    ollama: createOllama({
      baseURL: ollamaBaseURL || 'http://localhost:11434/api',
    }),
  });
}
