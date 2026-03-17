import { generatedDocumentSchema, getExportFilename } from '@/lib/documents/export-request';
import { exportDocx } from '@/lib/documents/export-docx';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const parsed = generatedDocumentSchema.safeParse(
    (body as Record<string, unknown>)?.document
  );

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid document payload', details: parsed.error.issues }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const document = parsed.data;
  const filename = getExportFilename(document, 'docx');

  try {
    const buffer = await exportDocx(document);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('DOCX export error:', err);
    return new Response(
      JSON.stringify({ error: 'DOCX generation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
