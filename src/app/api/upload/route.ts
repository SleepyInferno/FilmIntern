import { NextResponse } from 'next/server';
import { parseFile } from '@/lib/parsers/registry';

const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.fdx', '.docx'];

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

  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file format: ${ext}. Accepted formats: ${ALLOWED_EXTENSIONS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    let result;
    if (ext === '.txt') {
      const content = await file.text();
      result = await parseFile(content, file.name);
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      result = await parseFile(buffer, file.name);
    }
    result.metadata.size = file.size;
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse file';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
