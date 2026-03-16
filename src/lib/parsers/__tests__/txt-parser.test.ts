import { describe, it, expect } from 'vitest';
import { parseTxt } from '../txt-parser';

describe('parseTxt', () => {
  it('extracts text, word count, and line count from a simple string', () => {
    const result = parseTxt('Hello world\nSecond line');
    expect(result.text).toBe('Hello world\nSecond line');
    expect(result.metadata.wordCount).toBe(4);
    expect(result.metadata.lineCount).toBe(2);
    expect(result.metadata.format).toBe('txt');
  });

  it('handles empty string correctly', () => {
    const result = parseTxt('');
    expect(result.text).toBe('');
    expect(result.metadata.wordCount).toBe(0);
    expect(result.metadata.lineCount).toBe(1);
    expect(result.metadata.format).toBe('txt');
  });

  it('counts words correctly for large text', () => {
    const words = Array.from({ length: 1000 }, (_, i) => `word${i}`);
    const text = words.join(' ');
    const result = parseTxt(text);
    expect(result.metadata.wordCount).toBe(1000);
  });
});
