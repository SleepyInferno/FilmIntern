import { describe, it, expect } from 'vitest';
import { parseTxt } from '../txt-parser';
import { parseFile } from '../registry';

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

describe('parseFile (registry)', () => {
  it('handles .txt files with string input and returns Promise<ParseResult>', async () => {
    const result = await parseFile('Hello world', 'test.txt');
    expect(result.text).toBe('Hello world');
    expect(result.metadata.format).toBe('txt');
    expect(result.metadata.filename).toBe('test.txt');
  });

  it('handles .txt files with Buffer input', async () => {
    const buffer = Buffer.from('Buffer content');
    const result = await parseFile(buffer, 'test.txt');
    expect(result.text).toBe('Buffer content');
    expect(result.metadata.format).toBe('txt');
  });

  it('throws for unsupported extension', async () => {
    await expect(parseFile('content', 'file.xyz')).rejects.toThrow('Unsupported file format: .xyz');
  });
});
