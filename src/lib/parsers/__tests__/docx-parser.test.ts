import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExtractRawText } = vi.hoisted(() => {
  return { mockExtractRawText: vi.fn() };
});

vi.mock('mammoth', () => ({
  default: {
    extractRawText: mockExtractRawText,
  },
}));

import { parseDocx } from '../docx-parser';

describe('parseDocx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts raw text from a DOCX buffer', async () => {
    mockExtractRawText.mockResolvedValue({ value: 'Hello world\nSecond line' });

    const buffer = Buffer.from('fake docx content');
    const result = await parseDocx(buffer, 'doc.docx');

    expect(result.text).toBe('Hello world\nSecond line');
    expect(result.metadata.filename).toBe('doc.docx');
    expect(result.metadata.wordCount).toBe(4);
    expect(result.metadata.lineCount).toBe(2);
  });

  it('sets format to "docx"', async () => {
    mockExtractRawText.mockResolvedValue({ value: 'Some text content' });

    const buffer = Buffer.from('fake docx content');
    const result = await parseDocx(buffer, 'doc.docx');

    expect(result.metadata.format).toBe('docx');
  });

  it('throws on empty document', async () => {
    mockExtractRawText.mockResolvedValue({ value: '' });

    const buffer = Buffer.from('fake docx content');
    await expect(parseDocx(buffer, 'empty.docx')).rejects.toThrow('empty or contains no extractable text');
  });

  it('counts words and lines correctly', async () => {
    mockExtractRawText.mockResolvedValue({ value: 'One two three\nFour five\nSix seven eight nine' });

    const buffer = Buffer.from('fake docx content');
    const result = await parseDocx(buffer, 'doc.docx');

    expect(result.metadata.wordCount).toBe(9);
    expect(result.metadata.lineCount).toBe(3);
  });
});
