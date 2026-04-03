import { db } from '@/lib/db';
import { applyAcceptedRewrites } from '@/lib/script-preview-utils';
import { parseScreenplay } from '@/lib/documents/screenplay-parser';
import { renderScreenplayHtml } from '@/lib/documents/render-screenplay-html';
import { exportScreenplayDocx } from '@/lib/documents/export-screenplay-docx';
import { toFilenameStem } from '@/lib/documents/export-request';
import { chromium } from 'playwright';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const projectId = body.projectId as string | undefined;
  const format = body.format as string | undefined;

  if (!projectId || !format || (format !== 'pdf' && format !== 'docx')) {
    return new Response(
      JSON.stringify({ error: 'Missing projectId or invalid format (pdf|docx)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const project = db.getProject(projectId);
  if (!project) {
    return new Response(
      JSON.stringify({ error: 'Project not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const source = (body.source as string) || 'suggestions';

  let revisedText = '';

  if (source === 'rewrite') {
    // Export the AI full rewrite
    if (!project.fullRewrite) {
      return new Response(
        JSON.stringify({ error: 'No full rewrite found. Generate one first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    revisedText = project.fullRewrite;
  } else {
    // Export with accepted suggestion rewrites applied
    let scriptText = '';
    if (project.uploadData) {
      try {
        const parsed = JSON.parse(project.uploadData);
        scriptText = parsed?.text ?? '';
      } catch {
        /* ignore parse errors */
      }
    }

    if (!scriptText) {
      return new Response(
        JSON.stringify({ error: 'No script text found for this project' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const suggestions = db.listSuggestions(projectId);
    revisedText = applyAcceptedRewrites(scriptText, suggestions);
  }

  // Parse into screenplay elements
  const elements = parseScreenplay(revisedText);

  const title = (body.title as string) || project.title || 'Revised Script';
  const stem = toFilenameStem(title + '-revised');
  const filename = `${stem}.${format}`;

  try {
    if (format === 'pdf') {
      const html = renderScreenplayHtml(elements, title);
      const browser = await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      });
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle' });
        const pdfBuffer = await page.pdf({
          format: 'Letter',
          printBackground: true,
          margin: {
            top: '1in',
            right: '1in',
            bottom: '1in',
            left: '1.5in',
          },
        });
        await page.close();
        const buffer = Buffer.from(pdfBuffer);
        const arrayBuf = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        ) as ArrayBuffer;

        return new Response(arrayBuf, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } finally {
        await browser.close();
      }
    }

    // DOCX
    const buffer = await exportScreenplayDocx(elements, title);
    const arrayBuf = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new Response(arrayBuf, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(`Revised script ${format.toUpperCase()} export error:`, err);
    return new Response(
      JSON.stringify({ error: `${format.toUpperCase()} generation failed` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
