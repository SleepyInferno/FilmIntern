import { db } from '@/lib/db';

const VALID_STATUSES = ['accepted', 'rejected', 'pending'] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; suggestionId: string }> }) {
  const { id, suggestionId } = await params;
  const body = await req.json();
  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: 'Invalid status. Must be: accepted, rejected, or pending' }, { status: 400 });
  }

  const project = db.getProject(id);
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  const suggestion = db.getSuggestion(suggestionId);
  if (!suggestion || suggestion.projectId !== id) {
    return Response.json({ error: 'Suggestion not found' }, { status: 404 });
  }

  db.updateSuggestionStatus(suggestionId, status);
  const updated = db.getSuggestion(suggestionId);
  return Response.json(updated);
}
