import { describe, it, expect } from 'vitest';
import {
  getAvailableDocumentKinds,
  getOutlineModes,
  supportsDocumentKind,
} from '../availability';
import type { DocumentKind } from '../types';

describe('getAvailableDocumentKinds', () => {
  it('returns report, outline, proposal for documentary', () => {
    expect(getAvailableDocumentKinds('documentary')).toEqual([
      'report',
      'outline',
      'proposal',
    ]);
  });

  it('returns report, outline, proposal for corporate', () => {
    expect(getAvailableDocumentKinds('corporate')).toEqual([
      'report',
      'outline',
      'proposal',
    ]);
  });

  it('returns report, outline, treatment for narrative', () => {
    expect(getAvailableDocumentKinds('narrative')).toEqual([
      'report',
      'outline',
      'treatment',
    ]);
  });

  it('returns report, outline, treatment for tv-episodic', () => {
    expect(getAvailableDocumentKinds('tv-episodic')).toEqual([
      'report',
      'outline',
      'treatment',
    ]);
  });

  it('returns report, outline for short-form', () => {
    expect(getAvailableDocumentKinds('short-form')).toEqual([
      'report',
      'outline',
    ]);
  });

  it('throws for unknown project type', () => {
    expect(() => getAvailableDocumentKinds('unknown')).toThrow(
      'Unknown project type: unknown'
    );
  });
});

describe('getOutlineModes', () => {
  it('returns beats and scene-by-scene for narrative', () => {
    expect(getOutlineModes('narrative')).toEqual(['beats', 'scene-by-scene']);
  });

  it('returns beats and scene-by-scene for tv-episodic', () => {
    expect(getOutlineModes('tv-episodic')).toEqual([
      'beats',
      'scene-by-scene',
    ]);
  });

  it('returns beats only for documentary', () => {
    expect(getOutlineModes('documentary')).toEqual(['beats']);
  });

  it('returns beats only for corporate', () => {
    expect(getOutlineModes('corporate')).toEqual(['beats']);
  });

  it('returns beats only for short-form', () => {
    expect(getOutlineModes('short-form')).toEqual(['beats']);
  });

  it('throws for unknown project type', () => {
    expect(() => getOutlineModes('unknown')).toThrow(
      'Unknown project type: unknown'
    );
  });
});

describe('supportsDocumentKind', () => {
  it('returns true for documentary + report', () => {
    expect(supportsDocumentKind('documentary', 'report')).toBe(true);
  });

  it('returns true for documentary + proposal', () => {
    expect(supportsDocumentKind('documentary', 'proposal')).toBe(true);
  });

  it('returns false for documentary + treatment', () => {
    expect(supportsDocumentKind('documentary', 'treatment')).toBe(false);
  });

  it('returns true for narrative + treatment', () => {
    expect(supportsDocumentKind('narrative', 'treatment')).toBe(true);
  });

  it('returns false for narrative + proposal', () => {
    expect(supportsDocumentKind('narrative', 'proposal')).toBe(false);
  });

  it('returns false for short-form + treatment', () => {
    expect(supportsDocumentKind('short-form', 'treatment')).toBe(false);
  });

  it('throws for unknown project type', () => {
    expect(() =>
      supportsDocumentKind('unknown', 'report' as DocumentKind)
    ).toThrow('Unknown project type: unknown');
  });
});
