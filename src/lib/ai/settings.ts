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
  anthropic: { model: 'claude-sonnet-4-5', apiKey: '' },
  openai: { model: 'gpt-4o', apiKey: '' },
  ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
};

const SETTINGS_DIR = path.join(process.cwd(), '.filmintern');
const SETTINGS_PATH = path.join(SETTINGS_DIR, 'settings.json');

export async function loadSettings(): Promise<AISettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      anthropic: { ...DEFAULT_SETTINGS.anthropic, ...parsed.anthropic },
      openai: { ...DEFAULT_SETTINGS.openai, ...parsed.openai },
      ollama: { ...DEFAULT_SETTINGS.ollama, ...parsed.ollama },
    };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return DEFAULT_SETTINGS;
    }
    throw err;
  }
}

export async function saveSettings(settings: AISettings): Promise<void> {
  await mkdir(SETTINGS_DIR, { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}
