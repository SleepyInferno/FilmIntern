/**
 * Screenplay DOCX builder.
 *
 * Converts parsed ScreenplayElement[] into a Word document with
 * industry-standard screenplay formatting: Courier New 12pt,
 * proper margins and indentation per element type.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  PageBreak,
} from 'docx';
import type { ScreenplayElement } from './screenplay-parser';

// Indentation values in twentieths of a point (1 inch = 1440 twips)
const TWIPS_PER_INCH = 1440;
const FONT = 'Courier New';
const FONT_SIZE = 24; // 12pt in half-points

/** Convert screenplay elements into DOCX paragraphs. */
function buildScreenplayParagraphs(elements: ScreenplayElement[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const el of elements) {
    switch (el.type) {
      case 'blank':
        paragraphs.push(new Paragraph({ spacing: { after: 0 } }));
        break;

      case 'scene-heading':
        paragraphs.push(
          new Paragraph({
            spacing: { before: 240 },
            children: [
              new TextRun({
                text: el.text.toUpperCase(),
                font: FONT,
                size: FONT_SIZE,
                bold: true,
              }),
            ],
          })
        );
        break;

      case 'character':
        paragraphs.push(
          new Paragraph({
            spacing: { before: 240 },
            indent: { left: Math.round(TWIPS_PER_INCH * 2.2) },
            children: [
              new TextRun({
                text: el.text.toUpperCase(),
                font: FONT,
                size: FONT_SIZE,
              }),
            ],
          })
        );
        break;

      case 'parenthetical':
        paragraphs.push(
          new Paragraph({
            indent: {
              left: Math.round(TWIPS_PER_INCH * 1.6),
              right: Math.round(TWIPS_PER_INCH * 2),
            },
            children: [
              new TextRun({
                text: el.text,
                font: FONT,
                size: FONT_SIZE,
              }),
            ],
          })
        );
        break;

      case 'dialogue':
        paragraphs.push(
          new Paragraph({
            indent: {
              left: Math.round(TWIPS_PER_INCH * 1),
              right: Math.round(TWIPS_PER_INCH * 1.5),
            },
            children: [
              new TextRun({
                text: el.text,
                font: FONT,
                size: FONT_SIZE,
              }),
            ],
          })
        );
        break;

      case 'transition':
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 240, after: 240 },
            children: [
              new TextRun({
                text: el.text.toUpperCase(),
                font: FONT,
                size: FONT_SIZE,
              }),
            ],
          })
        );
        break;

      case 'action':
      default:
        paragraphs.push(
          new Paragraph({
            spacing: { before: 240 },
            children: [
              new TextRun({
                text: el.text,
                font: FONT,
                size: FONT_SIZE,
              }),
            ],
          })
        );
        break;
    }
  }

  return paragraphs;
}

/** Build a centered title page. */
function buildTitlePage(title: string, writtenBy?: string): Paragraph[] {
  const paragraphs: Paragraph[] = [
    // Spacer to push title to ~1/3 down the page
    new Paragraph({ spacing: { before: 4800 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: title.toUpperCase(),
          font: FONT,
          size: FONT_SIZE,
          bold: true,
        }),
      ],
    }),
  ];

  if (writtenBy) {
    paragraphs.push(
      new Paragraph({ spacing: { before: 480 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Written by', font: FONT, size: FONT_SIZE }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120 },
        children: [
          new TextRun({ text: writtenBy, font: FONT, size: FONT_SIZE }),
        ],
      })
    );
  }

  // Page break after title
  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

  return paragraphs;
}

/**
 * Build a complete screenplay DOCX Document.
 */
export function buildScreenplayDocx(
  elements: ScreenplayElement[],
  title: string,
  writtenBy?: string
): Document {
  const titleParagraphs = buildTitlePage(title, writtenBy);
  const bodyParagraphs = buildScreenplayParagraphs(elements);

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: FONT_SIZE,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: TWIPS_PER_INCH,       // 1in
              right: TWIPS_PER_INCH,      // 1in
              bottom: TWIPS_PER_INCH,     // 1in
              left: Math.round(TWIPS_PER_INCH * 1.5), // 1.5in
            },
          },
        },
        children: [...titleParagraphs, ...bodyParagraphs],
      },
    ],
  });
}

/**
 * Export screenplay elements as DOCX bytes.
 */
export async function exportScreenplayDocx(
  elements: ScreenplayElement[],
  title: string,
  writtenBy?: string
): Promise<Buffer> {
  const doc = buildScreenplayDocx(elements, title, writtenBy);
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
