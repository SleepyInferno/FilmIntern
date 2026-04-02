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
  const mask = (key: string) => key.length > 8 ? key.slice(0, 4) + '...' + key.slice(-4) : key ? '****' : '';
  return {
    ...settings,
    anthropic: { ...settings.anthropic, apiKey: mask(settings.anthropic.apiKey) },
    openai: { ...settings.openai, apiKey: mask(settings.openai.apiKey) },
  };
}
