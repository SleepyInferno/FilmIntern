import { describe, it, expect, vi } from 'vitest';
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

// --- Layout Profile Tests ---

describe('getLayoutProfile', () => {
  // Lazy import to allow RED phase to fail if module doesn't exist
  const importLayout = () => import('../export-layout');

  it('returns screenplay-document for narrative outlines', async () => {
    const { getLayoutProfile } = await importLayout();
    const doc = makeTestDocument({
      projectType: 'narrative',
      kind: 'outline',
    });
    expect(getLayoutProfile(doc)).toBe('screenplay-document');
  });

  it('returns screenplay-document for tv-episodic treatments', async () => {
    const { getLayoutProfile } = await importLayout();
    const doc = makeTestDocument({
      projectType: 'tv-episodic',
      kind: 'treatment',
    });
    expect(getLayoutProfile(doc)).toBe('screenplay-document');
  });

  it('returns coverage-report for narrative reports', async () => {
    const { getLayoutProfile } = await importLayout();
    const doc = makeTestDocument({
      projectType: 'narrative',
      kind: 'report',
    });
    expect(getLayoutProfile(doc)).toBe('coverage-report');
  });

  it('returns coverage-report for tv-episodic reports', async () => {
    const { getLayoutProfile } = await importLayout();
    const doc = makeTestDocument({
      projectType: 'tv-episodic',
      kind: 'report',
    });
    expect(getLayoutProfile(doc)).toBe('coverage-report');
  });

  it('returns professional-document for documentary outputs', async () => {
    const { getLayoutProfile } = await importLayout();
    const doc = makeTestDocument({
      projectType: 'documentary',
      kind: 'report',
    });
    expect(getLayoutProfile(doc)).toBe('professional-document');
  });

  it('returns professional-document for corporate outputs', async () => {
    const { getLayoutProfile } = await importLayout();
    const doc = makeTestDocument({
      projectType: 'corporate',
      kind: 'proposal',
    });
    expect(getLayoutProfile(doc)).toBe('professional-document');
  });
});

// --- HTML Rendering Tests ---

describe('renderDocumentHtml', () => {
  const importRenderer = () => import('../render-document-html');

  it('includes cover labels Title, Type, Date, and Written by', async () => {
    const { renderDocumentHtml } = await importRenderer();
    const doc = makeTestDocument();
    const html = renderDocumentHtml(doc);

    expect(html).toContain('Title');
    expect(html).toContain('Type');
    expect(html).toContain('Date');
    expect(html).toContain('Written by');
  });

  it('includes quote label Q1 in the rendered output', async () => {
    const { renderDocumentHtml } = await importRenderer();
    const doc = makeTestDocument();
    const html = renderDocumentHtml(doc);

    expect(html).toContain('Q1');
  });
});

// --- PDF Export Tests ---

describe('exportPdf', () => {
  it('calls page.pdf with printBackground: true', async () => {
    const mockPdf = vi.fn().mockResolvedValue(Buffer.from('fake-pdf'));
    const mockSetContent = vi.fn().mockResolvedValue(undefined);
    const mockClose = vi.fn().mockResolvedValue(undefined);
    const mockNewPage = vi.fn().mockResolvedValue({
      setContent: mockSetContent,
      pdf: mockPdf,
      close: mockClose,
    });
    const mockBrowserClose = vi.fn().mockResolvedValue(undefined);
    const mockLaunch = vi.fn().mockResolvedValue({
      newPage: mockNewPage,
      close: mockBrowserClose,
    });

    vi.doMock('playwright', () => ({
      chromium: { launch: mockLaunch },
    }));

    // Clear any cached module
    const { exportPdf } = await import('../export-pdf');
    const doc = makeTestDocument();
    const result = await exportPdf(doc);

    expect(mockPdf).toHaveBeenCalledWith(
      expect.objectContaining({ printBackground: true })
    );
    expect(result).toBeInstanceOf(Buffer);

    vi.doUnmock('playwright');
  });
});
