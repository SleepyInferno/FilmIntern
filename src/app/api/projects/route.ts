import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

export async function GET() {
  const projects = db.listProjects();
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, projectType, fileName } = body;

  if (!title || !projectType) {
    return NextResponse.json({ error: 'title and projectType required' }, { status: 400 });
  }

  const project = db.createProject({ id: generateId(), title, projectType, fileName });
  return NextResponse.json(project, { status: 201 });
}
