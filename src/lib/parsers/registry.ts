import { parseTxt, type ParseResult } from './txt-parser';

export type { ParseResult } from './txt-parser';

export function parseFile(content: string, filename: string): ParseResult {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();

  switch (ext) {
    case '.txt':
      const result = parseTxt(content);
      result.metadata.filename = filename;
      return result;
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}
