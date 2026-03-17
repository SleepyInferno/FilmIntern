import { PDFParse } from 'pdf-parse';
import { detectScreenplayStructure } from './screenplay-utils';
import type { ParseResult } from './txt-parser';

export async function parsePdf(buffer: Buffer, filename: string): Promise<ParseResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Invalid PDF: empty or missing buffer');
  }

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const text = result.text || '';

  if (!text.trim()) {
    throw new Error('PDF contains no extractable text content');
  }

  const lines = text.split('\n');
  const structure = detectScreenplayStructure(text);

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
      lineCount: lines.length,
      format: structure.isScreenplay ? 'pdf-screenplay' : 'pdf',
      filename,
    },
  };
}
