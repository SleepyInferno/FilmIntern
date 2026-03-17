import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetText = vi.fn();
const mockDestroy = vi.fn();

vi.mock('pdf-parse', () => {
  return {
    PDFParse: class MockPDFParse {
      constructor() {}
      getText = mockGetText;
      destroy = mockDestroy;
    },
  };
});

import { parsePdf } from '../pdf-parser';

describe('parsePdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts text content from a PDF buffer', async () => {
    mockGetText.mockResolvedValue({
      text: 'Hello world\nSecond line',
      pages: [],
      total: 1,
    });

    const buffer = Buffer.from('fake pdf content');
    const result = await parsePdf(buffer, 'test.pdf');

    expect(result.text).toBe('Hello world\nSecond line');
    expect(result.metadata.filename).toBe('test.pdf');
    expect(result.metadata.wordCount).toBe(4);
    expect(result.metadata.lineCount).toBe(2);
  });

  it('sets format to "pdf" for non-screenplay PDFs', async () => {
    mockGetText.mockResolvedValue({
      text: 'This is a regular document about programming.',
      pages: [],
      total: 1,
    });

    const buffer = Buffer.from('fake pdf content');
    const result = await parsePdf(buffer, 'doc.pdf');

    expect(result.metadata.format).toBe('pdf');
  });

  it('sets format to "pdf-screenplay" when screenplay patterns detected', async () => {
    const screenplayText = 'INT. LIBRARY - DAY\n\nJANE\nHello there.\n\nEXT. PARK - NIGHT\n\nJOHN\nGoodbye.';
    mockGetText.mockResolvedValue({
      text: screenplayText,
      pages: [],
      total: 1,
    });

    const buffer = Buffer.from('fake pdf content');
    const result = await parsePdf(buffer, 'movie.pdf');

    expect(result.metadata.format).toBe('pdf-screenplay');
  });

  it('throws on empty/invalid buffer', async () => {
    const emptyBuffer = Buffer.alloc(0);
    await expect(parsePdf(emptyBuffer, 'empty.pdf')).rejects.toThrow('empty or missing buffer');
  });

  it('throws when PDF contains no text', async () => {
    mockGetText.mockResolvedValue({
      text: '',
      pages: [],
      total: 1,
    });

    const buffer = Buffer.from('fake pdf content');
    await expect(parsePdf(buffer, 'blank.pdf')).rejects.toThrow('no extractable text');
  });

  it('counts words and lines correctly', async () => {
    mockGetText.mockResolvedValue({
      text: 'One two three\nFour five\nSix',
      pages: [],
      total: 1,
    });

    const buffer = Buffer.from('fake pdf content');
    const result = await parsePdf(buffer, 'test.pdf');

    expect(result.metadata.wordCount).toBe(6);
    expect(result.metadata.lineCount).toBe(3);
  });
});
