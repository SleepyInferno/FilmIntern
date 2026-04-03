/**
 * Screenplay HTML renderer for PDF export via Playwright.
 *
 * Converts parsed ScreenplayElement[] into a complete HTML document
 * with industry-standard screenplay formatting (Courier 12pt,
 * proper margins and indentation per element type).
 */

import type { ScreenplayElement } from './screenplay-parser';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderElement(el: ScreenplayElement): string {
  switch (el.type) {
    case 'blank':
      return '<div class="sp-blank">&nbsp;</div>';
    case 'scene-heading':
      return `<div class="sp-scene-heading">${escapeHtml(el.text)}</div>`;
    case 'character':
      return `<div class="sp-character">${escapeHtml(el.text)}</div>`;
    case 'parenthetical':
      return `<div class="sp-parenthetical">${escapeHtml(el.text)}</div>`;
    case 'dialogue':
      return `<div class="sp-dialogue">${escapeHtml(el.text)}</div>`;
    case 'transition':
      return `<div class="sp-transition">${escapeHtml(el.text)}</div>`;
    case 'action':
      return `<div class="sp-action">${escapeHtml(el.text)}</div>`;
    default:
      return `<div class="sp-action">${escapeHtml(el.text)}</div>`;
  }
}

/**
 * Industry-standard screenplay CSS.
 *
 * Page: US Letter (8.5 x 11in)
 * Font: Courier 12pt
 * Margins: 1.5in left, 1in right, 1in top/bottom
 * Element indentation per WGA formatting standards.
 */
const SCREENPLAY_CSS = `
  @page {
    size: letter;
    margin: 1in 1in 1in 1.5in;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12pt;
    line-height: 1;
    color: #000;
  }

  .sp-blank {
    height: 12pt;
  }

  .sp-scene-heading {
    font-weight: bold;
    text-transform: uppercase;
    padding-top: 12pt;
    padding-bottom: 0;
  }

  .sp-character {
    text-transform: uppercase;
    padding-left: 2.2in;
    padding-top: 12pt;
  }

  .sp-parenthetical {
    padding-left: 1.6in;
    padding-right: 2in;
  }

  .sp-dialogue {
    padding-left: 1in;
    padding-right: 1.5in;
  }

  .sp-transition {
    text-align: right;
    text-transform: uppercase;
    padding-top: 12pt;
    padding-bottom: 12pt;
  }

  .sp-action {
    padding-top: 12pt;
  }

  .sp-title-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    page-break-after: always;
  }

  .sp-title-page h1 {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 24pt;
  }

  .sp-title-page .sp-by {
    font-size: 12pt;
    margin-bottom: 6pt;
  }

  .sp-title-page .sp-author {
    font-size: 12pt;
  }
`;

/**
 * Render a complete screenplay HTML document from parsed elements.
 */
export function renderScreenplayHtml(
  elements: ScreenplayElement[],
  title: string,
  writtenBy?: string
): string {
  const bodyHtml = elements.map(renderElement).join('\n');

  const titlePage = `
    <div class="sp-title-page">
      <h1>${escapeHtml(title)}</h1>
      ${writtenBy ? `<div class="sp-by">Written by</div><div class="sp-author">${escapeHtml(writtenBy)}</div>` : ''}
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${SCREENPLAY_CSS}</style>
</head>
<body>
  ${titlePage}
  ${bodyHtml}
</body>
</html>`;
}
