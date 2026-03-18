import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ACCENT_PRESETS,
  applyAccentColor,
  getStoredAccent,
  setStoredAccent,
  ACCENT_FLASH_SCRIPT,
  type AccentColor,
} from '../theme';

describe('ACCENT_PRESETS', () => {
  it('has exactly 4 preset keys: amber, blue, emerald, purple', () => {
    const keys = Object.keys(ACCENT_PRESETS);
    expect(keys).toHaveLength(4);
    expect(keys).toEqual(expect.arrayContaining(['amber', 'blue', 'emerald', 'purple']));
  });

  it('each preset has dark and light sub-objects with primary and primaryFg strings', () => {
    for (const key of Object.keys(ACCENT_PRESETS) as AccentColor[]) {
      const preset = ACCENT_PRESETS[key];
      expect(preset).toHaveProperty('dark');
      expect(preset).toHaveProperty('light');
      for (const mode of ['dark', 'light'] as const) {
        expect(typeof preset[mode].primary).toBe('string');
        expect(typeof preset[mode].primaryFg).toBe('string');
      }
    }
  });
});

describe('applyAccentColor', () => {
  let setPropertySpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setPropertySpy = vi.fn();
    Object.defineProperty(document.documentElement, 'style', {
      value: { setProperty: setPropertySpy },
      writable: true,
      configurable: true,
    });
  });

  it('sets --primary to amber dark value when called with amber/dark', () => {
    applyAccentColor('amber', 'dark');
    expect(setPropertySpy).toHaveBeenCalledWith('--primary', 'oklch(0.769 0.188 70.08)');
  });

  it('sets --primary to blue light value when called with blue/light', () => {
    applyAccentColor('blue', 'light');
    expect(setPropertySpy).toHaveBeenCalledWith('--primary', 'oklch(0.55 0.18 250)');
  });

  it('sets --ring to match --primary', () => {
    applyAccentColor('amber', 'dark');
    expect(setPropertySpy).toHaveBeenCalledWith('--ring', 'oklch(0.769 0.188 70.08)');
  });

  it('sets --primary-foreground to the correct value', () => {
    applyAccentColor('emerald', 'light');
    expect(setPropertySpy).toHaveBeenCalledWith('--primary-foreground', 'oklch(1 0 0)');
  });
});

describe('getStoredAccent', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
    });
  });

  it('returns amber when localStorage is empty', () => {
    expect(getStoredAccent()).toBe('amber');
  });

  it('returns stored accent color value', () => {
    mockStorage['accent-color'] = 'blue';
    expect(getStoredAccent()).toBe('blue');
  });
});

describe('setStoredAccent', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
    });
  });

  it('writes accent-color to localStorage', () => {
    setStoredAccent('blue');
    expect(localStorage.setItem).toHaveBeenCalledWith('accent-color', 'blue');
  });
});

describe('ACCENT_FLASH_SCRIPT', () => {
  it('is a non-empty string', () => {
    expect(typeof ACCENT_FLASH_SCRIPT).toBe('string');
    expect(ACCENT_FLASH_SCRIPT.length).toBeGreaterThan(0);
  });

  it('contains all preset color values inline', () => {
    expect(ACCENT_FLASH_SCRIPT).toContain('oklch(0.769 0.188 70.08)');
    expect(ACCENT_FLASH_SCRIPT).toContain('oklch(0.666 0.179 58.318)');
  });
});
