import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = db.getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const project = db.updateProject(id, {
    ...(body.title !== undefined && { title: body.title }),
    ...(body.uploadData !== undefined && { uploadData: JSON.stringify(body.uploadData) }),
    ...(body.analysisData !== undefined && { analysisData: JSON.stringify(body.analysisData) }),
    ...(body.reportDocument !== undefined && { reportDocument: JSON.stringify(body.reportDocument) }),
    ...(body.generatedDocuments !== undefined && { generatedDocuments: JSON.stringify(body.generatedDocuments) }),
    ...(body.criticAnalysis !== undefined && { criticAnalysis: body.criticAnalysis }),
  });

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.deleteProject(id);
  return new NextResponse(null, { status: 204 });
}
