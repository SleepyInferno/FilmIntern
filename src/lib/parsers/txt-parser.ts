export interface ParseResult {
  text: string;
  metadata: {
    wordCount: number;
    lineCount: number;
    format: string;
    filename?: string;
    size?: number;
  };
}

export function parseTxt(content: string): ParseResult {
  const text = content;
  const wordCount =
    content.length === 0
      ? 0
      : content
          .split(/\s+/)
          .filter((w) => w.length > 0).length;
  const lineCount = content.split('\n').length;

  return {
    text,
    metadata: {
      wordCount,
      lineCount,
      format: 'txt',
    },
  };
}
