import { parseTxt, type ParseResult } from './txt-parser';
import { parsePdf } from './pdf-parser';
import { parseFdx } from './fdx-parser';
import { parseDocx } from './docx-parser';

export type { ParseResult } from './txt-parser';

const SUPPORTED_EXTENSIONS = ['.txt', '.pdf', '.fdx', '.docx'];

export async function parseFile(content: Buffer | string, filename: string): Promise<ParseResult> {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();

  switch (ext) {
    case '.txt': {
      const text = typeof content === 'string' ? content : content.toString('utf-8');
      const result = parseTxt(text);
      result.metadata.filename = filename;
      return result;
    }
    case '.pdf':
      if (typeof content === 'string') {
        throw new Error('PDF files require binary (Buffer) input');
      }
      return parsePdf(content, filename);
    case '.fdx':
      if (typeof content === 'string') {
        throw new Error('FDX files require binary (Buffer) input');
      }
      return parseFdx(content, filename);
    case '.docx':
      if (typeof content === 'string') {
        throw new Error('DOCX files require binary (Buffer) input');
      }
      return parseDocx(content, filename);
    default:
      throw new Error(`Unsupported file format: ${ext}. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`);
  }
}
