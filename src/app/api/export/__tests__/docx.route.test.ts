import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GeneratedDocument } from '@/lib/documents/types';

// Mock the exportDocx function before route import
vi.mock('@/lib/documents/export-docx', () => ({
  exportDocx: vi.fn(),
}));

import { exportDocx } from '@/lib/documents/export-docx';
import { POST } from '@/app/api/export/docx/route';

const mockExportDocx = vi.mocked(exportDocx);

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

describe('POST /api/export/docx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportDocx.mockResolvedValue(Buffer.from('fake-docx-bytes'));
  });

  it('returns 200 with DOCX content type and .docx Content-Disposition', async () => {
    const request = new Request('http://localhost/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document: testDocument }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(response.headers.get('Content-Disposition')).toMatch(/\.docx"/);
    expect(mockExportDocx).toHaveBeenCalledOnce();
  });

  it('returns 400 for missing document body', async () => {
    const request = new Request('http://localhost/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
