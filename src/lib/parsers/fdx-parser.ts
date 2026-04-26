import { XMLParser } from 'fast-xml-parser';
import type { ParseResult } from './txt-parser';

// Hard cap on XML element count to bound parse-time memory. A pathological FDX
// (or a deliberately crafted one) can pack the 10 MB upload limit with millions
// of empty <Paragraph><Text/></Paragraph> nodes that explode 10–50× in memory
// once parsed. Real FDX files for feature-length scripts top out around ~50k
// elements; 200k gives generous headroom with a hard ceiling well below OOM.
const MAX_XML_ELEMENTS = 200_000;

export async function parseFdx(buffer: Buffer, filename: string): Promise<ParseResult> {
  const xmlContent = buffer.toString('utf-8');

  // Cheap pre-parse element-count check: counting opening tags is O(n) over
  // the source string and can't be fooled by entity expansion (we disable
  // entities below regardless).
  let elementCount = 0;
  for (let i = 0; i < xmlContent.length; i++) {
    if (xmlContent.charCodeAt(i) === 60 /* '<' */) elementCount++;
    if (elementCount > MAX_XML_ELEMENTS) {
      throw new Error(`FDX file contains too many XML elements (>${MAX_XML_ELEMENTS}). Aborting parse.`);
    }
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // Disable XML entity expansion — FDX has no legitimate need for custom
    // entities, and leaving them on exposes us to billion-laughs / quadratic
    // blowup attacks (historical fast-xml-parser CVE class).
    processEntities: false,
    allowBooleanAttributes: false,
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
