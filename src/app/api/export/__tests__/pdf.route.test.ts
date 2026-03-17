import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GeneratedDocument } from '@/lib/documents/types';

// Mock the exportPdf function before route import
vi.mock('@/lib/documents/export-pdf', () => ({
  exportPdf: vi.fn(),
}));

import { exportPdf } from '@/lib/documents/export-pdf';
import { POST } from '@/app/api/export/pdf/route';

const mockExportPdf = vi.mocked(exportPdf);

const testDocument: GeneratedDocument = {
  id: 'test-doc-1',
  kind: 'report',
  projectType: 'documentary',
  title: 'Wildlife Report',
  writtenBy: 'Test Author',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  cover: {
    title: 'Wildlife Report',
    typeLabel: 'Analysis Report',
    writtenBy: 'Test Author',
    dateLabel: '2026-01-01T00:00:00.000Z',
    projectTypeLabel: 'Documentary',
  },
  content: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Test content.' }] },
    ],
  },
  quoteRefs: [
    {
      id: 'q1',
      label: 'Q1',
      text: 'A quote.',
      speaker: 'Narrator',
      sourceSection: 'keyQuotes' as const,
    },
  ],
  sourceText: 'Sample transcript text.',
};

describe('POST /api/export/pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportPdf.mockResolvedValue(Buffer.from('fake-pdf-bytes'));
  });

  it('returns 200 with application/pdf content type and .pdf Content-Disposition', async () => {
    const request = new Request('http://localhost/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document: testDocument }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toMatch(/\.pdf"/);
    expect(mockExportPdf).toHaveBeenCalledOnce();
  });

  it('returns 400 for missing document body', async () => {
    const request = new Request('http://localhost/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
