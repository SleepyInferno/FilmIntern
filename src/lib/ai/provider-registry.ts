import { createProviderRegistry } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider-v2';
import type { AISettings } from './settings';

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

export interface HealthCheckResult {
  ok: boolean;
  error?: string;
}

export async function checkProviderHealth(settings: AISettings): Promise<HealthCheckResult> {
  const { provider } = settings;

  if (provider === 'anthropic') {
    if (!settings.anthropic.apiKey) {
      return { ok: false, error: 'Anthropic API key not configured. Add it in Settings or set ANTHROPIC_API_KEY environment variable.' };
    }
  }

  if (provider === 'openai') {
    if (!settings.openai.apiKey) {
      return { ok: false, error: 'OpenAI API key not configured. Add it in Settings or set OPENAI_API_KEY environment variable.' };
    }
  }

  if (provider === 'ollama') {
    try {
      const tagUrl = settings.ollama.baseURL.replace(/\/api\/?$/, '/api/tags');
      const resp = await fetch(tagUrl, { signal: AbortSignal.timeout(3000) });
      if (!resp.ok) {
        return { ok: false, error: `Ollama not responding at ${settings.ollama.baseURL}. Is it running?` };
      }
    } catch {
      return { ok: false, error: `Cannot reach Ollama at ${settings.ollama.baseURL}. Make sure Ollama is running.` };
    }
  }

  return { ok: true };
}
