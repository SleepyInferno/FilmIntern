import { describe, it } from 'vitest';

describe('suggestions API route (SUGG-01, SUGG-03)', () => {
  it.todo('POST /api/projects/[id]/suggestions returns 404 for non-existent project');
  it.todo('POST /api/projects/[id]/suggestions returns 400 if project has no analysisData');
  it.todo('POST /api/projects/[id]/suggestions returns 400 for unsupported project type');
  it.todo('POST /api/projects/[id]/suggestions clamps count to 1-25 range');
  it.todo('POST /api/projects/[id]/suggestions clears existing suggestions before generating');
  it.todo('POST /api/projects/[id]/suggestions returns NDJSON content type');
  it.todo('GET /api/projects/[id]/suggestions returns persisted suggestions as JSON array');
  it.todo('GET /api/projects/[id]/suggestions returns 404 for non-existent project');
  it.todo('DELETE /api/projects/[id]/suggestions removes all suggestions and returns 204');
});
