import { describe, it, expect } from 'vitest';
import { computeWordDiff } from '@/lib/diff-utils';

describe('computeWordDiff', () => {
  it('returns unchanged span when texts are identical', () => {
    const changes = computeWordDiff('hello world', 'hello world');
    expect(changes).toHaveLength(1);
    expect(changes[0].value).toBe('hello world');
    expect(changes[0].added).toBeFalsy();
    expect(changes[0].removed).toBeFalsy();
  });

  it('marks removed words with removed flag', () => {
    const changes = computeWordDiff('the quick brown fox', 'the brown fox');
    const removed = changes.filter(c => c.removed);
    expect(removed.length).toBeGreaterThan(0);
    expect(removed.some(c => c.value.includes('quick'))).toBe(true);
  });

  it('marks added words with added flag', () => {
    const changes = computeWordDiff('the brown fox', 'the quick brown fox');
    const added = changes.filter(c => c.added);
    expect(added.length).toBeGreaterThan(0);
    expect(added.some(c => c.value.includes('quick'))).toBe(true);
  });

  it('handles replacement (removed + added pair)', () => {
    const changes = computeWordDiff('I ran fast', 'I sprinted quickly');
    const removed = changes.filter(c => c.removed);
    const added = changes.filter(c => c.added);
    expect(removed.length).toBeGreaterThan(0);
    expect(added.length).toBeGreaterThan(0);
  });

  it('handles empty strings', () => {
    const changes = computeWordDiff('', 'new text');
    expect(changes.some(c => c.added)).toBe(true);
  });
});
