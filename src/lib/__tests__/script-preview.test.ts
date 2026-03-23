import { describe, it, expect } from 'vitest';

// Pure function extracted for testability (will be used by script-preview component via useMemo)
function applyAcceptedRewrites(
  scriptText: string,
  suggestions: Array<{ originalText: string; rewriteText: string; status: string }>
): string {
  const accepted = suggestions
    .filter(s => s.status === 'accepted')
    .map(s => ({ original: s.originalText, rewrite: s.rewriteText, index: scriptText.indexOf(s.originalText) }))
    .filter(s => s.index !== -1)
    .sort((a, b) => b.index - a.index);

  let result = scriptText;
  for (const s of accepted) {
    result = result.slice(0, s.index) + s.rewrite + result.slice(s.index + s.original.length);
  }
  return result;
}

describe('applyAcceptedRewrites', () => {
  it('returns original text when no suggestions', () => {
    expect(applyAcceptedRewrites('Hello world', [])).toBe('Hello world');
  });

  it('returns original text when all suggestions are pending', () => {
    const result = applyAcceptedRewrites('Hello world', [
      { originalText: 'Hello', rewriteText: 'Hi', status: 'pending' },
    ]);
    expect(result).toBe('Hello world');
  });

  it('returns original text when all suggestions are rejected', () => {
    const result = applyAcceptedRewrites('Hello world', [
      { originalText: 'Hello', rewriteText: 'Hi', status: 'rejected' },
    ]);
    expect(result).toBe('Hello world');
  });

  it('applies a single accepted suggestion', () => {
    const result = applyAcceptedRewrites('Hello world', [
      { originalText: 'Hello', rewriteText: 'Hi', status: 'accepted' },
    ]);
    expect(result).toBe('Hi world');
  });

  it('applies multiple accepted suggestions without offset drift', () => {
    const script = 'The quick brown fox jumps over the lazy dog';
    const result = applyAcceptedRewrites(script, [
      { originalText: 'quick brown', rewriteText: 'slow grey', status: 'accepted' },
      { originalText: 'lazy dog', rewriteText: 'energetic cat', status: 'accepted' },
    ]);
    expect(result).toBe('The slow grey fox jumps over the energetic cat');
  });

  it('skips suggestions whose originalText is not found in script', () => {
    const result = applyAcceptedRewrites('Hello world', [
      { originalText: 'nonexistent', rewriteText: 'replacement', status: 'accepted' },
    ]);
    expect(result).toBe('Hello world');
  });

  it('handles accepted suggestion that changes text length', () => {
    const script = 'A short line. Another short line.';
    const result = applyAcceptedRewrites(script, [
      { originalText: 'A short line.', rewriteText: 'A much longer replacement line here.', status: 'accepted' },
    ]);
    expect(result).toBe('A much longer replacement line here. Another short line.');
  });
});
