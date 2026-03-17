import mammoth from 'mammoth';
import type { ParseResult } from './txt-parser';

export async function parseDocx(buffer: Buffer, filename: string): Promise<ParseResult> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;

  if (!text.trim()) {
    throw new Error('Document appears to be empty or contains no extractable text');
  }

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
      lineCount: text.split('\n').length,
      format: 'docx',
      filename,
    },
  };
}
