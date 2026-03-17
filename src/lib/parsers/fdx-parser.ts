import { XMLParser } from 'fast-xml-parser';
import type { ParseResult } from './txt-parser';

export async function parseFdx(buffer: Buffer, filename: string): Promise<ParseResult> {
  const xmlContent = buffer.toString('utf-8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  const doc = parser.parse(xmlContent);

  const content = doc?.FinalDraft?.Content;
  if (!content?.Paragraph) {
    throw new Error('Invalid FDX file: no content paragraphs found');
  }

  const paragraphs = Array.isArray(content.Paragraph)
    ? content.Paragraph
    : [content.Paragraph];

  const lines: string[] = [];
  for (const para of paragraphs) {
    // Handle multiple <Text> children (formatting runs within a paragraph)
    let text = '';
    if (para.Text !== undefined && para.Text !== null) {
      const texts = Array.isArray(para.Text) ? para.Text : [para.Text];
      text = texts
        .map((t: any) =>
          typeof t === 'string'
            ? t
            : typeof t === 'object' && t !== null
              ? t['#text'] || ''
              : String(t),
        )
        .join('');
    }
    if (text.trim()) {
      lines.push(text.trim());
    }
  }

  const fullText = lines.join('\n');

  if (!fullText.trim()) {
    throw new Error('FDX file contains no text content');
  }

  return {
    text: fullText,
    metadata: {
      wordCount: fullText.split(/\s+/).filter(w => w.length > 0).length,
      lineCount: lines.length,
      format: 'fdx',
      filename,
    },
  };
}
