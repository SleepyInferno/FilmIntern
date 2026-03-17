import { generatedDocumentSchema, getExportFilename } from '@/lib/documents/export-request';
import { exportPdf } from '@/lib/documents/export-pdf';

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
  const filename = getExportFilename(document, 'pdf');

  try {
    const buffer = await exportPdf(document);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF export error:', err);
    return new Response(
      JSON.stringify({ error: 'PDF generation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
