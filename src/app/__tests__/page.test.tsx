import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../page';
import { WorkspaceProvider } from '@/contexts/workspace-context';

function renderHome() {
  return render(
    <WorkspaceProvider>
      <Home />
    </WorkspaceProvider>
  );
}

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

// Mock fetch for analyze and generate APIs
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock buildReportDocument
const { mockBuildReportDocument } = vi.hoisted(() => ({
  mockBuildReportDocument: vi.fn(),
}));

vi.mock('@/lib/documents/report-document', () => ({
  buildReportDocument: mockBuildReportDocument,
}));

// Mock the child components that are complex
vi.mock('@/components/file-dropzone', () => ({
  FileDropzone: ({ onFileUploaded }: { onFileUploaded: (data: { text: string; metadata: Record<string, unknown> }) => void }) => (
    <button
      data-testid="mock-upload"
      onClick={() => onFileUploaded({ text: 'mock transcript', metadata: {} })}
    >
      Upload
    </button>
  ),
}));

vi.mock('@/components/content-preview', () => ({
  ContentPreview: () => <div data-testid="content-preview">Preview</div>,
}));


const mockReportDoc = {
  id: 'report-documentary-1',
  kind: 'report' as const,
  projectType: 'documentary',
  title: 'Untitled',
  writtenBy: 'FilmIntern',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  cover: {
    title: 'Untitled',
    typeLabel: 'Analysis Report',
    writtenBy: 'FilmIntern',
    dateLabel: '2026-01-01T00:00:00.000Z',
    projectTypeLabel: 'Documentary',
  },
  content: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Summary' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Overview text.' }] },
    ],
  },
  quoteRefs: [
    { id: 'quote-1', label: 'Q1', text: 'A test quote.', speaker: 'Speaker', sourceSection: 'keyQuotes' },
  ],
  sourceText: 'mock transcript',
};

describe('Home page - post-analysis document workspace', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockScrollIntoView.mockClear();
    mockBuildReportDocument.mockReturnValue(mockReportDoc);

    // First call: /api/projects POST (project creation)
    // Subsequent calls: /api/analyze stream
    const analysisStream = {
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                JSON.stringify({ summary: { overview: 'A test doc.' } })
              ),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    };
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'proj-1', title: 'Test', projectType: 'documentary' }),
      })
      .mockResolvedValueOnce(analysisStream)
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  });

  it('shows document workspace with Report tab after analysis completes', async () => {
    renderHome();

    // Upload a file
    fireEvent.click(screen.getByTestId('mock-upload'));

    // Run analysis
    fireEvent.click(screen.getByText('Run Analysis'));

    await waitFor(() => {
      expect(screen.getByText('Report')).toBeDefined();
    });
  });

  it('shows generation buttons after analysis', async () => {
    renderHome();

    fireEvent.click(screen.getByTestId('mock-upload'));
    fireEvent.click(screen.getByText('Run Analysis'));

    await waitFor(() => {
      // Documentary supports outline and proposal
      expect(screen.getByText('Generate Outline')).toBeDefined();
      expect(screen.getByText('Generate Proposal')).toBeDefined();
    });
  });

  it('calls /api/documents/generate when clicking a generation button', async () => {
    // Call order: 1) /api/projects POST, 2) /api/analyze stream, 3) /api/projects PUT (save), 4) /api/documents/generate
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'proj-1', title: 'Test', projectType: 'documentary' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(
                  JSON.stringify({ summary: { overview: 'A test doc.' } })
                ),
              })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'gen-1',
          kind: 'outline',
          projectType: 'documentary',
          title: 'Test Outline',
          cover: {
            title: 'Test Outline',
            typeLabel: 'Outline',
            writtenBy: 'FilmIntern',
            dateLabel: '2026-01-01T00:00:00.000Z',
            projectTypeLabel: 'Documentary',
          },
          content: { type: 'doc', content: [] },
          quoteRefs: [],
          sourceText: 'mock transcript',
        }),
      });

    renderHome();

    fireEvent.click(screen.getByTestId('mock-upload'));
    fireEvent.click(screen.getByText('Run Analysis'));

    await waitFor(() => {
      expect(screen.getByText('Generate Outline')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Generate Outline'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/documents/generate',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

});
