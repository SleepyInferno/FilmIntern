import { NextResponse } from 'next/server';
import { parseFile } from '@/lib/parsers/registry';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File exceeds 10MB limit. Please upload a smaller file.' },
      { status: 400 }
    );
  }

  if (!file.name.endsWith('.txt')) {
    return NextResponse.json(
      { error: 'Only .txt files are supported. Please upload a plain text transcript.' },
      { status: 400 }
    );
  }

  const content = await file.text();
  const result = parseFile(content, file.name);
  result.metadata.size = file.size;

  return NextResponse.json(result);
}
