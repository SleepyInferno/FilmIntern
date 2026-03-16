import { describe, it, expect } from 'vitest';
import { POST } from '../route';

function createUploadRequest(filename: string, content: string, size?: number): Request {
  const file = new File([content], filename, { type: 'text/plain' });
  // If a custom size is needed (for testing size limit), we override via Object.defineProperty
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size });
  }
  const formData = new FormData();
  formData.append('file', file);
  return new Request('http://localhost/api/upload', { method: 'POST', body: formData });
}

function createEmptyRequest(): Request {
  const formData = new FormData();
  return new Request('http://localhost/api/upload', { method: 'POST', body: formData });
}

describe('POST /api/upload', () => {
  it('returns 200 with parsed text and metadata for a valid .txt file', async () => {
    const content = 'Hello world\nThis is a test transcript.\nThird line here.';
    const req = createUploadRequest('interview.txt', content);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.text).toBe(content);
    expect(data.metadata).toBeDefined();
    expect(data.metadata.wordCount).toBe(10);
    expect(data.metadata.lineCount).toBe(3);
    expect(data.metadata.format).toBe('txt');
    expect(data.metadata.filename).toBe('interview.txt');
    expect(typeof data.metadata.size).toBe('number');
  });

  it('returns 400 with error for a .pdf file', async () => {
    const req = createUploadRequest('document.pdf', 'fake pdf content');
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Only .txt files are supported. Please upload a plain text transcript.');
  });

  it('returns 400 with error when no file is provided', async () => {
    const req = createEmptyRequest();
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('No file provided');
  });

  it('returns 400 with error for a file exceeding 10MB', async () => {
    const content = 'small content';
    const oversizeBytes = 10 * 1024 * 1024 + 1; // just over 10MB
    const req = createUploadRequest('large.txt', content, oversizeBytes);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('File exceeds 10MB limit. Please upload a smaller file.');
  });
});
