import { describe, it, expect } from 'vitest';
import { applyAcceptedRewrites } from '@/lib/script-preview-utils';

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

  it('binds duplicate originalText suggestions to distinct occurrences', () => {
    // Regression: previous indexOf-up-front impl resolved both suggestions
    // to the same first occurrence, then the second one was dropped.
    const script = 'I love you.\nLater...\nI love you.';
    const result = applyAcceptedRewrites(script, [
      { originalText: 'I love you.', rewriteText: 'I adore you.', status: 'accepted' },
      { originalText: 'I love you.', rewriteText: 'I always have.', status: 'accepted' },
    ]);
    expect(result).toBe('I adore you.\nLater...\nI always have.');
  });

  it('preserves unmatched duplicates instead of overwriting prior matches', () => {
    const script = 'Hello\nHello\nHello';
    const result = applyAcceptedRewrites(script, [
      { originalText: 'Hello', rewriteText: 'Hi', status: 'accepted' },
      { originalText: 'Hello', rewriteText: 'Hey', status: 'accepted' },
    ]);
    // Two accepted matches consumed; third 'Hello' remains untouched.
    expect(result).toBe('Hi\nHey\nHello');
  });
});
