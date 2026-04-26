import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

export interface AISettings {
  provider: 'anthropic' | 'openai' | 'ollama';
  anthropic: { model: string; apiKey: string };
  openai: { model: string; apiKey: string };
  ollama: { model: string; baseURL: string };
}

export const DEFAULT_SETTINGS: AISettings = {
  provider: 'anthropic',
  anthropic: { model: 'claude-sonnet-4-6', apiKey: '' },
  openai: { model: 'gpt-5.4', apiKey: '' },
  ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
};

export const SETTINGS_DIR_PATH = process.env.SETTINGS_DIR || path.join(process.cwd(), '.filmintern');
const SETTINGS_PATH = path.join(SETTINGS_DIR_PATH, 'settings.json');

async function loadSettingsFromDisk(): Promise<AISettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      anthropic: {
        ...DEFAULT_SETTINGS.anthropic,
        ...parsed.anthropic,
        apiKey: parsed.anthropic?.apiKey || process.env.ANTHROPIC_API_KEY || '',
      },
      openai: {
        ...DEFAULT_SETTINGS.openai,
        ...parsed.openai,
        apiKey: parsed.openai?.apiKey || process.env.OPENAI_API_KEY || '',
      },
      ollama: {
        ...DEFAULT_SETTINGS.ollama,
        ...parsed.ollama,
        baseURL: parsed.ollama?.baseURL || process.env.OLLAMA_BASE_URL || DEFAULT_SETTINGS.ollama.baseURL,
      },
    };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        ...DEFAULT_SETTINGS,
        anthropic: { ...DEFAULT_SETTINGS.anthropic, apiKey: process.env.ANTHROPIC_API_KEY || '' },
        openai: { ...DEFAULT_SETTINGS.openai, apiKey: process.env.OPENAI_API_KEY || '' },
        ollama: { ...DEFAULT_SETTINGS.ollama, baseURL: process.env.OLLAMA_BASE_URL || DEFAULT_SETTINGS.ollama.baseURL },
      };
    }
    throw err;
  }
}

// In-memory cache with short TTL to avoid filesystem reads on every AI call
let _settingsCache: { value: AISettings; ts: number } | null = null;
const SETTINGS_TTL_MS = 5000;

export async function loadSettings(): Promise<AISettings> {
  const now = Date.now();
  if (_settingsCache && now - _settingsCache.ts < SETTINGS_TTL_MS) {
    return _settingsCache.value;
  }
  const value = await loadSettingsFromDisk();
  _settingsCache = { value, ts: now };
  return value;
}

export async function saveSettings(settings: AISettings): Promise<void> {
  _settingsCache = null; // invalidate cache on write
  await mkdir(SETTINGS_DIR_PATH, { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

/** Clear the in-memory settings cache (used by tests) */
export function clearSettingsCache(): void {
  _settingsCache = null;
}

/** Return settings with API keys masked for safe client-side display */
export function maskSettingsKeys(settings: AISettings): AISettings {
  return {
    ...settings,
    anthropic: { ...settings.anthropic, apiKey: maskKey(settings.anthropic.apiKey) },
    openai: { ...settings.openai, apiKey: maskKey(settings.openai.apiKey) },
  };
}

export function maskKey(key: string): string {
  return key.length > 8 ? key.slice(0, 4) + '...' + key.slice(-4) : key ? '****' : '';
}

// Matches the output shape of maskKey (e.g. "sk-p...AbCd" or "****"). Used by the
// settings PUT handler to detect when the client echoed back a masked value
// instead of a real key, so we can preserve the stored secret.
const MASKED_KEY_RE = /^.{1,4}\.\.\..{1,4}$|^\*{4}$/;

export function isMaskedKey(value: string): boolean {
  return MASKED_KEY_RE.test(value);
}

export interface BaseURLValidationResult {
  ok: boolean;
  reason?: string;
}

// Validate a user-supplied Ollama base URL. The threat model is a single-user
// LAN deployment, so private RFC1918 hosts are intentionally allowed; we only
// reject schemes and addresses that would enable cloud-metadata exfiltration
// or credential leakage.
export function validateOllamaBaseURL(raw: string): BaseURLValidationResult {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'baseURL must be a valid URL' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'baseURL must use http or https' };
  }
  if (url.username || url.password) {
    return { ok: false, reason: 'baseURL must not contain credentials' };
  }
  const host = url.hostname;
  if (host === '0.0.0.0' || host === '::' || host === '[::]') {
    return { ok: false, reason: 'baseURL host 0.0.0.0/:: is not a valid target' };
  }
  // Block IPv4 link-local (169.254.0.0/16) — covers AWS/GCP/Azure metadata at 169.254.169.254
  if (/^169\.254\./.test(host)) {
    return { ok: false, reason: 'baseURL targets a link-local/metadata address' };
  }
  // Block IPv6 link-local (fe80::/10)
  const v6 = host.startsWith('[') ? host.slice(1, -1) : host;
  if (/^fe[89ab][0-9a-f]:/i.test(v6)) {
    return { ok: false, reason: 'baseURL targets an IPv6 link-local address' };
  }
  return { ok: true };
}
