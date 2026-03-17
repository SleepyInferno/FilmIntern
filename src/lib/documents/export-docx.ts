/**
 * DOCX byte generation from GeneratedDocument content.
 *
 * Uses the `docx` library to build a Word document with cover page,
 * body sections, and quote reference appendix that preserves labels like Q1.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  BorderStyle,
} from 'docx';
import type { GeneratedDocument } from './types';
import { getLayoutProfile, type LayoutProfile } from './export-layout';

/**
 * Build cover-page paragraphs from the document's cover metadata.
 */
function buildCoverPage(document: GeneratedDocument): Paragraph[] {
  const { cover } = document;

  return [
    // Spacer
    new Paragraph({ spacing: { before: 2400 } }),
    // Title field
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Title',
          bold: true,
          size: 20,
          color: '666666',
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: cover.title, size: 32, bold: true })],
    }),
    // Type field
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Type',
          bold: true,
          size: 20,
          color: '666666',
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: cover.typeLabel, size: 24 })],
    }),
    // Date field
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Date',
          bold: true,
          size: 20,
          color: '666666',
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: cover.dateLabel, size: 24 })],
    }),
    // Written by field
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Written by',
          bold: true,
          size: 20,
          color: '666666',
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: cover.writtenBy, size: 24 })],
    }),
    // Page break after cover
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];
}

/**
 * Convert Tiptap JSON content nodes into DOCX paragraphs.
 */
function buildBodyParagraphs(
  content: Record<string, unknown>,
  _profile: LayoutProfile
): Paragraph[] {
  const nodes = (content.content as Array<Record<string, unknown>>) || [];
  const paragraphs: Paragraph[] = [];

  for (const node of nodes) {
    const converted = convertNode(node);
    paragraphs.push(...converted);
  }

  return paragraphs;
}

function convertNode(node: Record<string, unknown>): Paragraph[] {
  const type = node.type as string;
  const children = node.content as Array<Record<string, unknown>> | undefined;
  const attrs = node.attrs as Record<string, unknown> | undefined;

  switch (type) {
    case 'paragraph': {
      const runs = children ? children.flatMap(convertInline) : [];
      return [new Paragraph({ children: runs })];
    }
    case 'heading': {
      const level = (attrs?.level as number) || 2;
      const headingMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
      };
      const runs = children ? children.flatMap(convertInline) : [];
      return [
        new Paragraph({
          heading: headingMap[level] || HeadingLevel.HEADING_2,
          children: runs,
        }),
      ];
    }
    case 'bulletList':
    case 'orderedList': {
      if (!children) return [];
      const items: Paragraph[] = [];
      for (const listItem of children) {
        const itemContent = listItem.content as
          | Array<Record<string, unknown>>
          | undefined;
        if (itemContent) {
          for (const innerNode of itemContent) {
            const innerRuns =
              (innerNode.content as Array<Record<string, unknown>>) || [];
            items.push(
              new Paragraph({
                bullet: { level: 0 },
                children: innerRuns.flatMap(convertInline),
              })
            );
          }
        }
      }
      return items;
    }
    case 'blockquote': {
      if (!children) return [];
      return children.flatMap((child) => {
        const runs = (child.content as Array<Record<string, unknown>>) || [];
        return [
          new Paragraph({
            indent: { left: 720 },
            border: {
              left: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: '999999',
                space: 10,
              },
            },
            children: runs.flatMap(convertInline),
          }),
        ];
      });
    }
    default: {
      if (children) {
        return children.flatMap(convertNode);
      }
      return [];
    }
  }
}

function convertInline(node: Record<string, unknown>): TextRun[] {
  const type = node.type as string;
  if (type !== 'text') return [];

  const text = (node.text as string) || '';
  const marks = node.marks as Array<Record<string, unknown>> | undefined;

  let bold = false;
  let italics = false;

  if (marks) {
    for (const mark of marks) {
      if (mark.type === 'bold') bold = true;
      if (mark.type === 'italic') italics = true;
    }
  }

  return [new TextRun({ text, bold, italics })];
}

/**
 * Build quote reference appendix paragraphs.
 */
function buildQuoteRefsParagraphs(document: GeneratedDocument): Paragraph[] {
  if (document.quoteRefs.length === 0) return [];

  const paragraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Quote References', bold: true })],
    }),
  ];

  for (const ref of document.quoteRefs) {
    const speaker = ref.speaker ? ` - ${ref.speaker}` : '';
    paragraphs.push(
      new Paragraph({
        indent: { left: 360 },
        spacing: { after: 120 },
        children: [
          new TextRun({ text: ref.label, bold: true }),
          new TextRun({ text: `${speaker}: "${ref.text}"` }),
        ],
      })
    );
  }

  return paragraphs;
}

/**
 * Get font configuration based on layout profile.
 */
function getDefaultFont(profile: LayoutProfile): string {
  switch (profile) {
    case 'screenplay-document':
      return 'Courier New';
    case 'coverage-report':
      return 'Times New Roman';
    case 'professional-document':
    default:
      return 'Helvetica';
  }
}

/**
 * Build the full docx Document object from a GeneratedDocument.
 *
 * Exported for testing - allows inspecting the document structure
 * without going through Packer serialization.
 */
export function buildDocxDocument(document: GeneratedDocument): Document {
  const profile = getLayoutProfile(document);
  const font = getDefaultFont(profile);

  const coverParagraphs = buildCoverPage(document);
  const bodyParagraphs = buildBodyParagraphs(document.content, profile);
  const quoteParagraphs = buildQuoteRefsParagraphs(document);

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font,
            size: 24, // 12pt in half-points
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1080, // 0.75in in twentieths of a point
              right: 1080,
              bottom: 1080,
              left: 1080,
            },
          },
        },
        children: [...coverParagraphs, ...bodyParagraphs, ...quoteParagraphs],
      },
    ],
  });
}

/**
 * Export a GeneratedDocument as DOCX bytes.
 *
 * Uses the `docx` library's Document and Packer to build a proper
 * Word document from the canonical document state.
 */
export async function exportDocx(
  document: GeneratedDocument
): Promise<Buffer> {
  const doc = buildDocxDocument(document);
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
