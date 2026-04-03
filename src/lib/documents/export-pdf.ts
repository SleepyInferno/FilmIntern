/**
 * PDF byte generation from rendered export HTML.
 *
 * Launches Playwright Chromium, sets the generated HTML content,
 * and returns PDF bytes with professional print settings.
 */

import { chromium } from 'playwright';
import type { GeneratedDocument } from './types';
import { renderDocumentHtml } from './render-document-html';

/**
 * Export a GeneratedDocument as PDF bytes.
 *
 * Uses Playwright Chromium for reliable pagination, typography,
 * and print-quality output from the canonical document state.
 */
export async function exportPdf(
  document: GeneratedDocument
): Promise<Buffer> {
  const html = renderDocumentHtml(document);

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
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
      },
    });

    await page.close();
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
