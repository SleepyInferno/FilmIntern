import { describe, it, expect } from 'vitest';
import type { GeneratedDocument } from '../types';

// --- Fixture ---

function makeTestDocument(
  overrides: Partial<GeneratedDocument> = {}
): GeneratedDocument {
  return {
    id: 'test-doc-1',
    kind: 'report',
    projectType: 'documentary',
    title: 'Wildlife Report',
    writtenBy: 'Jane Doe',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    cover: {
      title: 'Wildlife Report',
      typeLabel: 'Analysis Report',
      writtenBy: 'Jane Doe',
      dateLabel: '2026-01-15T00:00:00Z',
      projectTypeLabel: 'Documentary',
    },
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'This is body content.' }],
        },
      ],
    },
    quoteRefs: [
      {
        id: 'q1',
        label: 'Q1',
        text: 'The wild is beautiful.',
        speaker: 'Narrator',
        sourceSection: 'keyQuotes',
      },
    ],
    sourceText: 'Some raw source text.',
    ...overrides,
  };
}

// --- DOCX Export Tests ---

describe('exportDocx', () => {
  const importDocx = () => import('../export-docx');

  it('produces a Buffer from Packer.toBuffer', async () => {
    const { exportDocx } = await importDocx();
    const doc = makeTestDocument();
    const result = await exportDocx(doc);

    expect(result).toBeInstanceOf(Buffer);
  });

  it('includes cover labels Title, Type, Date, and Written by in document structure', async () => {
    const { exportDocx, buildDocxDocument } = await importDocx();
    const doc = makeTestDocument();
    const docxDoc = buildDocxDocument(doc);

    // Traverse sections to find cover-page text runs
    const allText = extractAllText(docxDoc);

    expect(allText).toContain('Title');
    expect(allText).toContain('Type');
    expect(allText).toContain('Date');
    expect(allText).toContain('Written by');
  });

  it('includes quote label Q1 in the document structure', async () => {
    const { buildDocxDocument } = await importDocx();
    const doc = makeTestDocument();
    const docxDoc = buildDocxDocument(doc);

    const allText = extractAllText(docxDoc);
    expect(allText).toContain('Q1');
  });
});

/**
 * Helper to extract all text from a docx Document object's internal XML tree.
 * The `docx` library stores text as bare strings inside `root` arrays
 * (e.g. within w:t elements), so this walker collects all string leaves.
 */
function extractAllText(docxDoc: unknown): string {
  const texts: string[] = [];

  function walk(obj: unknown): void {
    if (typeof obj === 'string') {
      // Bare string leaf inside a root array (e.g. w:t text content)
      texts.push(obj);
      return;
    }
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach(walk);
    } else {
      for (const value of Object.values(obj as Record<string, unknown>)) {
        walk(value);
      }
    }
  }

  walk(docxDoc);
  return texts.join(' ');
}
