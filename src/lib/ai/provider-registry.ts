import { createProviderRegistry } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider-v2';
import { createHash } from 'crypto';
import type { AISettings } from './settings';

// Cache registry to avoid recreating provider clients on every request
let _registryCache: ReturnType<typeof createProviderRegistry> | null = null;
let _registryCacheKey = '';

export function buildRegistry(ollamaBaseURL?: string, anthropicApiKey?: string, openaiApiKey?: string) {
  const key = createHash('sha256').update(`${ollamaBaseURL ?? ''}|${anthropicApiKey ?? ''}|${openaiApiKey ?? ''}`).digest('hex');
  if (_registryCache && _registryCacheKey === key) return _registryCache;

  _registryCache = createProviderRegistry({
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
  _registryCacheKey = key;
  return _registryCache;
}

/**
 * Build registry + resolve modelId from settings in one call.
 * Replaces the 8-line pattern duplicated across 7 API routes.
 */
export function getModelForSettings(settings: AISettings) {
  const registry = buildRegistry(
    settings.ollama.baseURL,
    settings.anthropic.apiKey || undefined,
    settings.openai.apiKey || undefined,
  );
  const modelId = ({
    anthropic: `anthropic:${settings.anthropic.model}`,
    openai: `openai:${settings.openai.model}`,
    ollama: `ollama:${settings.ollama.model}`,
  } as const)[settings.provider];
  return { registry, modelId };
}

/**
 * Lighter/cheaper model for structured extraction and validation passes.
 * Uses the same provider the user configured — no extra API key needed.
 */
export function getLightModelForSettings(settings: AISettings) {
  const registry = buildRegistry(
    settings.ollama.baseURL,
    settings.anthropic.apiKey || undefined,
    settings.openai.apiKey || undefined,
  );
  const lightModelId = ({
    anthropic: 'anthropic:claude-haiku-4-5-20251001',
    openai: 'openai:gpt-4o-mini',
    ollama: `ollama:${settings.ollama.model}`, // no lighter option — use same model
  } as const)[settings.provider];
  return { registry, modelId: lightModelId };
}

/** Clear the cached registry (used by tests) */
export function clearRegistryCache(): void {
  _registryCache = null;
  _registryCacheKey = '';
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
