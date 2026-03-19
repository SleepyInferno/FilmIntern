import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProjectsSidebar } from '../projects-sidebar';
import { WorkspaceProvider } from '@/contexts/workspace-context';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockProjects = [
  {
    id: 'proj-1',
    title: 'My Documentary',
    projectType: 'documentary',
    fileName: 'doc.txt',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'proj-2',
    title: 'My Narrative',
    projectType: 'narrative',
    fileName: 'narr.txt',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

function renderSidebar() {
  return render(
    <WorkspaceProvider>
      <ProjectsSidebar />
    </WorkspaceProvider>
  );
}

describe('library operations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('clicking a project calls loadProject with correct ID (LIB-03)', async () => {
    // GET /api/projects returns the list
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      })
      // GET /api/projects/{id} for loadProject call
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'proj-1',
          title: 'My Documentary',
          projectType: 'documentary',
          fileName: 'doc.txt',
          uploadData: JSON.stringify({ text: 'transcript', metadata: {} }),
          analysisData: JSON.stringify({ summary: { overview: 'test' } }),
          reportDocument: JSON.stringify({ id: 'report-1', kind: 'report', content: {} }),
          generatedDocuments: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      })
      // Re-fetch after loadProject sets currentProjectId
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      });

    renderSidebar();

    // Wait for projects to render
    await waitFor(() => {
      expect(screen.getByText('My Documentary')).toBeDefined();
      expect(screen.getByText('My Narrative')).toBeDefined();
    });

    // Click the first project
    fireEvent.click(screen.getByText('My Documentary'));

    // Verify loadProject was called -- it fetches GET /api/projects/{id}
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1');
    });
  });

  it('delete removes project from sidebar list (LIB-04)', async () => {
    // GET /api/projects returns the list
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      })
      // DELETE /api/projects/proj-1
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    renderSidebar();

    // Wait for projects to render
    await waitFor(() => {
      expect(screen.getByText('My Documentary')).toBeDefined();
      expect(screen.getByText('My Narrative')).toBeDefined();
    });

    // Find the delete button for the first project
    const deleteButtons = screen.getAllByTitle('Delete project');
    expect(deleteButtons.length).toBe(2);

    // Click delete on the first project
    fireEvent.click(deleteButtons[0]);

    // Wait for the project to be removed from the list
    await waitFor(() => {
      expect(screen.queryByText('My Documentary')).toBeNull();
    });

    // The second project should still be visible
    expect(screen.getByText('My Narrative')).toBeDefined();

    // Verify DELETE was called
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/projects/proj-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
