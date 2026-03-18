/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReadFile, mockWriteFile, mockMkdir } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
  mockMkdir: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}));

import { loadSettings, saveSettings, DEFAULT_SETTINGS, AISettings } from '../settings';

describe('settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DEFAULT_SETTINGS', () => {
    it('has anthropic as default provider', () => {
      expect(DEFAULT_SETTINGS.provider).toBe('anthropic');
    });

    it('has claude-sonnet-4-6 as default anthropic model', () => {
      expect(DEFAULT_SETTINGS.anthropic.model).toBe('claude-sonnet-4-6');
    });

    it('has gpt-5.4 as default openai model', () => {
      expect(DEFAULT_SETTINGS.openai.model).toBe('gpt-5.4');
    });

    it('has llama3.1 as default ollama model', () => {
      expect(DEFAULT_SETTINGS.ollama.model).toBe('llama3.1');
    });

    it('has default ollama baseURL', () => {
      expect(DEFAULT_SETTINGS.ollama.baseURL).toBe('http://localhost:11434/api');
    });
  });

  describe('loadSettings', () => {
    it('returns DEFAULT_SETTINGS when no file exists', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValue(err);

      const settings = await loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('reads and parses settings from disk', async () => {
      const saved: AISettings = {
        provider: 'openai',
        anthropic: { model: 'claude-sonnet-4-6', apiKey: '' },
        openai: { model: 'gpt-4o-mini', apiKey: '' },
        ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(saved));

      const settings = await loadSettings();
      expect(settings.provider).toBe('openai');
      expect(settings.openai.model).toBe('gpt-4o-mini');
    });

    it('merges saved values with defaults for missing fields', async () => {
      const partial = { provider: 'ollama' };
      mockReadFile.mockResolvedValue(JSON.stringify(partial));

      const settings = await loadSettings();
      expect(settings.provider).toBe('ollama');
      // Should have defaults for missing fields
      expect(settings.anthropic.model).toBe('claude-sonnet-4-6');
      expect(settings.openai.model).toBe('gpt-5.4');
    });
  });

  describe('saveSettings', () => {
    it('creates directory and writes JSON to disk', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const settings: AISettings = {
        provider: 'openai',
        anthropic: { model: 'claude-sonnet-4-6', apiKey: '' },
        openai: { model: 'gpt-4o', apiKey: '' },
        ollama: { model: 'llama3.1', baseURL: 'http://localhost:11434/api' },
      };

      await saveSettings(settings);

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('.filmintern'),
        { recursive: true }
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        JSON.stringify(settings, null, 2),
        'utf-8'
      );
    });
  });
});
