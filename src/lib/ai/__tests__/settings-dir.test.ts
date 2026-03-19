import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

describe('SETTINGS_DIR configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses SETTINGS_DIR env var when set', async () => {
    process.env.SETTINGS_DIR = '/tmp/test-settings';
    const mod = await import('../settings');
    expect(mod.SETTINGS_DIR_PATH).toBe('/tmp/test-settings');
  });

  it('falls back to process.cwd()/.filmintern when SETTINGS_DIR is not set', async () => {
    delete process.env.SETTINGS_DIR;
    const mod = await import('../settings');
    expect(mod.SETTINGS_DIR_PATH).toBe(path.join(process.cwd(), '.filmintern'));
  });
});
