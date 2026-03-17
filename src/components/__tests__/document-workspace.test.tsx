import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentWorkspace } from '../document-workspace';
import type { GeneratedDocument, ExportFormat } from '@/lib/documents/types';

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

const mockReportDocument: GeneratedDocument = {
  id: 'report-doc-1',
  kind: 'report',
  projectType: 'documentary',
  title: 'Test Documentary',
  writtenBy: 'Test Author',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  cover: {
    title: 'Test Documentary',
    typeLabel: 'Analysis Report',
    writtenBy: 'Test Author',
    dateLabel: '2026-01-01T00:00:00.000Z',
    projectTypeLabel: 'Documentary',
  },
  content: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Summary' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Test summary content.' }] },
    ],
  },
  quoteRefs: [
    {
      id: 'quote-1',
      label: 'Q1',
      text: 'A notable quote from the transcript.',
      speaker: 'Jane Doe',
      sourceSection: 'keyQuotes',
    },
  ],
  sourceText: 'Sample transcript.',
};

const mockGeneratedDoc: GeneratedDocument = {
  id: 'gen-doc-1',
  kind: 'proposal',
  projectType: 'documentary',
  title: 'Strategic Proposal',
  writtenBy: 'Test Author',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  cover: {
    title: 'Strategic Proposal',
    typeLabel: 'Strategic Proposal',
    writtenBy: 'Test Author',
    dateLabel: '2026-01-01T00:00:00.000Z',
    projectTypeLabel: 'Documentary',
  },
  content: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Proposal' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Proposal content.' }] },
    ],
  },
  quoteRefs: [
    {
      id: 'quote-1',
      label: 'Q1',
      text: 'A notable quote from the transcript.',
      speaker: 'Jane Doe',
      sourceSection: 'keyQuotes',
    },
  ],
  sourceText: 'Sample transcript.',
};

const defaultProps = {
  projectType: 'documentary',
  reportDocument: mockReportDocument,
  generatedDocuments: [mockGeneratedDoc],
  activeDocumentId: 'report-doc-1',
  onActiveDocumentChange: vi.fn(),
  onGenerateDocument: vi.fn(),
  onUpdateDocument: vi.fn(),
  onQuoteJump: vi.fn(),
  onExport: vi.fn(),
};

describe('DocumentWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScrollIntoView.mockClear();
  });

  it('renders Report tab and generated document tabs', () => {
    render(<DocumentWorkspace {...defaultProps} />);

    expect(screen.getByText('Report')).toBeDefined();
    expect(screen.getByText('Strategic Proposal')).toBeDefined();
  });

  it('renders generation buttons for documentary project type', () => {
    render(<DocumentWorkspace {...defaultProps} generatedDocuments={[]} />);

    // Documentary supports: outline, proposal (not treatment)
    expect(screen.getByText('Generate Outline')).toBeDefined();
    expect(screen.getByText('Generate Proposal')).toBeDefined();
    expect(screen.queryByText('Generate Treatment')).toBeNull();
  });

  it('renders treatment button for narrative project type', () => {
    render(
      <DocumentWorkspace
        {...defaultProps}
        projectType="narrative"
        generatedDocuments={[]}
      />
    );

    expect(screen.getByText('Generate Treatment')).toBeDefined();
    expect(screen.queryByText('Generate Proposal')).toBeNull();
  });

  it('renders a rich-text editor shell with correct testid', () => {
    render(
      <DocumentWorkspace
        {...defaultProps}
        activeDocumentId="gen-doc-1"
      />
    );

    expect(screen.getByTestId('document-editor')).toBeDefined();
  });

  it('renders export trigger button', () => {
    render(<DocumentWorkspace {...defaultProps} />);

    expect(screen.getByText('Export')).toBeDefined();
  });

  it('renders export dropdown options when Export is clicked', () => {
    render(<DocumentWorkspace {...defaultProps} />);

    fireEvent.click(screen.getByText('Export'));
    expect(screen.getByText('PDF (.pdf)')).toBeDefined();
    expect(screen.getByText('Word (.docx)')).toBeDefined();
  });

  it('clicking a quote ref in report tab calls scrollIntoView on the target', () => {
    render(
      <DocumentWorkspace
        {...defaultProps}
        activeDocumentId="report-doc-1"
      />
    );

    const quoteRef = screen.getByText('[Q1]');
    fireEvent.click(quoteRef);

    const target = document.querySelector('[data-quote-target="quote-1"]');
    expect(target).toBeDefined();
    expect(mockScrollIntoView).toHaveBeenCalled();
    expect(defaultProps.onQuoteJump).toHaveBeenCalledWith('quote-1');
  });

  it('clicking a quote ref in generated document tab jumps to the target', () => {
    render(
      <DocumentWorkspace
        {...defaultProps}
        activeDocumentId="gen-doc-1"
      />
    );

    const quoteRefs = screen.getAllByText('[Q1]');
    fireEvent.click(quoteRefs[0]);

    expect(mockScrollIntoView).toHaveBeenCalled();
    expect(defaultProps.onQuoteJump).toHaveBeenCalledWith('quote-1');
  });
});
