import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

describe('DATABASE_PATH configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses DATABASE_PATH env var when set', async () => {
    process.env.DATABASE_PATH = '/tmp/test-filmintern.db';
    const mod = await import('../db');
    expect(mod.DB_PATH).toBe('/tmp/test-filmintern.db');
  });

  it('falls back to process.cwd()/dev.db when DATABASE_PATH is not set', async () => {
    delete process.env.DATABASE_PATH;
    const mod = await import('../db');
    expect(mod.DB_PATH).toBe(path.join(process.cwd(), 'dev.db'));
  });
});
