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

export async function loadSettings(): Promise<AISettings> {
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

export async function saveSettings(settings: AISettings): Promise<void> {
  await mkdir(SETTINGS_DIR_PATH, { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}
