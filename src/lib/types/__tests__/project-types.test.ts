import { describe, it, expect } from 'vitest';
import { PROJECT_TYPES, type ProjectTypeConfig } from '../project-types';

describe('PROJECT_TYPES', () => {
  it('returns documentary config with correct id, label, and extensions', () => {
    const doc = PROJECT_TYPES['documentary'];
    expect(doc).toBeDefined();
    expect(doc.id).toBe('documentary');
    expect(doc.label).toBe('Documentary');
    expect(doc.acceptedExtensions).toEqual(['.txt', '.pdf', '.docx']);
  });

  it('documentary config has icon set to Video', () => {
    expect(PROJECT_TYPES['documentary'].icon).toBe('Video');
  });

  it('narrative accepts .pdf, .fdx, .docx', () => {
    expect(PROJECT_TYPES['narrative'].acceptedExtensions).toEqual(['.pdf', '.fdx', '.docx']);
  });

  it('has at least 1 project type entry', () => {
    expect(Object.keys(PROJECT_TYPES).length).toBeGreaterThanOrEqual(1);
  });

  it('all entries conform to ProjectTypeConfig interface shape', () => {
    for (const [key, config] of Object.entries(PROJECT_TYPES)) {
      expect(config.id).toBe(key);
      expect(typeof config.label).toBe('string');
      expect(typeof config.description).toBe('string');
      expect(typeof config.icon).toBe('string');
      expect(Array.isArray(config.acceptedExtensions)).toBe(true);
      expect(Array.isArray(config.acceptedMimeTypes)).toBe(true);
      expect(typeof config.fileTypeLabel).toBe('string');
    }
  });
});
