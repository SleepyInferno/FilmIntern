import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../page';

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

// Hoisted mock state for useWorkspace
const { mockUseWorkspace } = vi.hoisted(() => {
  const mockUseWorkspace = vi.fn();
  return { mockUseWorkspace };
});

vi.mock('@/contexts/workspace-context', () => ({
  useWorkspace: mockUseWorkspace,
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

// Helper to build default workspace mock state
function defaultWorkspaceState(overrides: Record<string, unknown> = {}) {
  return {
    currentProjectId: null,
    projectType: 'documentary',
    uploadData: null,
    analysisData: null,
    isAnalyzing: false,
    analysisError: null,
    reportDocument: null,
    generatedDocuments: [],
    activeDocumentId: '',
    title: '',
    writtenBy: 'FilmIntern',
    isNewProjectMode: true,
    setCurrentProjectId: vi.fn(),
    setProjectType: vi.fn(),
    setUploadData: vi.fn(),
    setAnalysisData: vi.fn(),
    setIsAnalyzing: vi.fn(),
    setAnalysisError: vi.fn(),
    setReportDocument: vi.fn(),
    setGeneratedDocuments: vi.fn(),
    setActiveDocumentId: vi.fn(),
    setTitle: vi.fn(),
    setWrittenBy: vi.fn(),
    setIsNewProjectMode: vi.fn(),
    resetWorkspace: vi.fn(),
    loadProject: vi.fn(),
    saveAnalysis: vi.fn().mockResolvedValue(undefined),
    saveGeneratedDocuments: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('Home page - post-analysis document workspace', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockScrollIntoView.mockClear();
    mockBuildReportDocument.mockReturnValue(mockReportDoc);

    // Default mock state: new project mode with no file uploaded yet
    mockUseWorkspace.mockReturnValue(defaultWorkspaceState());

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
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // PUT uploadData
      .mockResolvedValueOnce(analysisStream)
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  });

  it('shows document workspace with Report tab after analysis completes', async () => {
    // After upload + analysis, show report document workspace
    const ws = defaultWorkspaceState({
      reportDocument: mockReportDoc,
      analysisData: { summary: { overview: 'A test doc.' } },
      uploadData: { text: 'mock transcript', metadata: {} },
      isNewProjectMode: false,
    });
    mockUseWorkspace.mockReturnValue(ws);

    render(<Home />);

    expect(screen.getByText('Report')).toBeDefined();
  });

  it('shows generation buttons after analysis', async () => {
    const ws = defaultWorkspaceState({
      reportDocument: mockReportDoc,
      analysisData: { summary: { overview: 'A test doc.' } },
      uploadData: { text: 'mock transcript', metadata: {} },
      isNewProjectMode: false,
    });
    mockUseWorkspace.mockReturnValue(ws);

    render(<Home />);

    // Documentary supports outline and proposal
    expect(screen.getByText('Generate Outline')).toBeDefined();
    expect(screen.getByText('Generate Proposal')).toBeDefined();
  });

  it('calls /api/documents/generate when clicking a generation button', async () => {
    const mockSaveGeneratedDocs = vi.fn().mockResolvedValue(undefined);
    const ws = defaultWorkspaceState({
      currentProjectId: 'proj-1',
      reportDocument: mockReportDoc,
      analysisData: { summary: { overview: 'A test doc.' } },
      uploadData: { text: 'mock transcript', metadata: {} },
      generatedDocuments: [],
      isNewProjectMode: false,
      saveGeneratedDocuments: mockSaveGeneratedDocs,
      setGeneratedDocuments: vi.fn(),
      setActiveDocumentId: vi.fn(),
    });
    mockUseWorkspace.mockReturnValue(ws);

    mockFetch.mockResolvedValueOnce({
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
    }).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    render(<Home />);

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

describe('auto-save behavior', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockScrollIntoView.mockClear();
    mockBuildReportDocument.mockReturnValue(mockReportDoc);
  });

  function makeAnalysisStream() {
    const ndjson =
      JSON.stringify({ type: 'chunk', text: '{"summary":{"overview":"A test doc."}}' }) + '\n' +
      JSON.stringify({ type: 'done', data: { summary: { overview: 'A test doc.' } } }) + '\n';
    return {
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(ndjson),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    };
  }

  it('auto-save fires after analysis streaming completes', async () => {
    const mockSaveAnalysis = vi.fn().mockResolvedValue(undefined);
    const mockSetAnalysisData = vi.fn();
    const mockSetReportDocument = vi.fn();
    const mockSetActiveDocumentId = vi.fn();
    const mockSetIsAnalyzing = vi.fn();
    const mockSetAnalysisError = vi.fn();
    const mockSetGeneratedDocuments = vi.fn();

    const ws = defaultWorkspaceState({
      isNewProjectMode: true,
      currentProjectId: 'proj-1',
      uploadData: { text: 'mock transcript', metadata: {} },
      saveAnalysis: mockSaveAnalysis,
      setAnalysisData: mockSetAnalysisData,
      setReportDocument: mockSetReportDocument,
      setActiveDocumentId: mockSetActiveDocumentId,
      setIsAnalyzing: mockSetIsAnalyzing,
      setAnalysisError: mockSetAnalysisError,
      setGeneratedDocuments: mockSetGeneratedDocuments,
    });
    mockUseWorkspace.mockReturnValue(ws);

    // ensureProject returns existing ID, then analyze stream, then saveAnalysis
    mockFetch
      .mockResolvedValueOnce(makeAnalysisStream()) // POST /api/analyze
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    render(<Home />);

    // Upload already set via mock, click Run Analysis
    fireEvent.click(screen.getByText('Run Analysis'));

    await waitFor(() => {
      expect(mockSaveAnalysis).toHaveBeenCalledTimes(1);
      expect(mockSaveAnalysis).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          uploadData: expect.any(Object),
          analysisData: expect.any(Object),
          reportDocument: expect.any(Object),
        })
      );
    });
  });

  it('auto-save does NOT fire when analysis fails', async () => {
    const mockSaveAnalysis = vi.fn().mockResolvedValue(undefined);

    const ws = defaultWorkspaceState({
      isNewProjectMode: true,
      currentProjectId: 'proj-1',
      uploadData: { text: 'mock transcript', metadata: {} },
      saveAnalysis: mockSaveAnalysis,
    });
    mockUseWorkspace.mockReturnValue(ws);

    // Analysis returns error
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 }) // POST /api/analyze fails
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    render(<Home />);
    fireEvent.click(screen.getByText('Run Analysis'));

    // Wait for error state to be set
    await waitFor(() => {
      expect(ws.setAnalysisError).toHaveBeenCalled();
    });

    // Verify saveAnalysis was NOT called
    expect(mockSaveAnalysis).not.toHaveBeenCalled();
  });

  it('re-analysis reuses existing projectId via ensureProject', async () => {
    const mockSaveAnalysis = vi.fn().mockResolvedValue(undefined);

    const ws = defaultWorkspaceState({
      isNewProjectMode: true,
      currentProjectId: 'existing-123',
      uploadData: { text: 'mock transcript', metadata: {} },
      saveAnalysis: mockSaveAnalysis,
    });
    mockUseWorkspace.mockReturnValue(ws);

    mockFetch
      .mockResolvedValueOnce(makeAnalysisStream()) // POST /api/analyze
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    render(<Home />);
    fireEvent.click(screen.getByText('Run Analysis'));

    await waitFor(() => {
      expect(mockSaveAnalysis).toHaveBeenCalledTimes(1);
    });

    // Verify saveAnalysis was called with the existing project ID, not a new one
    expect(mockSaveAnalysis).toHaveBeenCalledWith(
      'existing-123',
      expect.any(Object)
    );

    // Verify no POST to /api/projects was made (ensureProject reused existing ID)
    const postProjectCalls = mockFetch.mock.calls.filter(
      ([url, opts]: [string, RequestInit]) => url === '/api/projects' && opts?.method === 'POST'
    );
    expect(postProjectCalls.length).toBe(0);
  });

  it('generated document save fires after document generation', async () => {
    const mockSaveGeneratedDocs = vi.fn().mockResolvedValue(undefined);
    const mockSetGeneratedDocuments = vi.fn();
    const mockSetActiveDocumentId = vi.fn();

    const ws = defaultWorkspaceState({
      currentProjectId: 'proj-1',
      reportDocument: mockReportDoc,
      analysisData: { summary: { overview: 'A test doc.' } },
      uploadData: { text: 'mock transcript', metadata: {} },
      generatedDocuments: [],
      isNewProjectMode: false,
      saveGeneratedDocuments: mockSaveGeneratedDocs,
      setGeneratedDocuments: mockSetGeneratedDocuments,
      setActiveDocumentId: mockSetActiveDocumentId,
    });
    mockUseWorkspace.mockReturnValue(ws);

    mockFetch.mockResolvedValueOnce({
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
    }).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    render(<Home />);

    fireEvent.click(screen.getByText('Generate Outline'));

    await waitFor(() => {
      expect(mockSaveGeneratedDocs).toHaveBeenCalledTimes(1);
      expect(mockSaveGeneratedDocs).toHaveBeenCalledWith(
        'proj-1',
        expect.arrayContaining([expect.objectContaining({ id: 'gen-1' })])
      );
    });
  });
});
