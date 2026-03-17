import { parseTxt, type ParseResult } from './txt-parser';

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
    case '.fdx':
    case '.docx':
      throw new Error(`Parser for ${ext} not yet implemented`);
    default:
      throw new Error(`Unsupported file format: ${ext}. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`);
  }
}
