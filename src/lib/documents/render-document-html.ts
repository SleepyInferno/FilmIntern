/**
 * HTML rendering from GeneratedDocument content for PDF printing.
 *
 * Converts the canonical Tiptap JSON content into a full HTML document
 * with cover page, body content, and quote reference appendix.
 */

import type { GeneratedDocument } from './types';
import { getLayoutProfile } from './export-layout';

/**
 * Render a simple HTML string from Tiptap-compatible JSON content.
 * Walks the node tree and produces basic HTML without requiring
 * a full ProseMirror/Tiptap instance.
 */
function renderContentToHtml(content: Record<string, unknown>): string {
  const nodes = (content.content as Array<Record<string, unknown>>) || [];
  return nodes.map(renderNode).join('\n');
}

function renderNode(node: Record<string, unknown>): string {
  const type = node.type as string;
  const children = node.content as Array<Record<string, unknown>> | undefined;
  const text = node.text as string | undefined;
  const attrs = node.attrs as Record<string, unknown> | undefined;

  if (type === 'text') {
    let result = escapeHtml(text || '');
    const marks = node.marks as Array<Record<string, unknown>> | undefined;
    if (marks) {
      for (const mark of marks) {
        const markType = mark.type as string;
        if (markType === 'bold') result = `<strong>${result}</strong>`;
        else if (markType === 'italic') result = `<em>${result}</em>`;
      }
    }
    return result;
  }

  const inner = children ? children.map(renderNode).join('') : '';

  switch (type) {
    case 'doc':
      return inner;
    case 'paragraph':
      return `<p>${inner}</p>`;
    case 'heading': {
      const level = (attrs?.level as number) || 2;
      return `<h${level}>${inner}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${inner}</ul>`;
    case 'orderedList':
      return `<ol>${inner}</ol>`;
    case 'listItem':
      return `<li>${inner}</li>`;
    case 'blockquote':
      return `<blockquote>${inner}</blockquote>`;
    case 'horizontalRule':
      return '<hr />';
    case 'hardBreak':
      return '<br />';
    default:
      return inner ? `<div>${inner}</div>` : '';
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build a complete cover page HTML section.
 */
function renderCoverHtml(document: GeneratedDocument): string {
  const { cover } = document;
  return `
    <div class="cover-page">
      <div class="cover-field"><span class="cover-label">Title</span><span class="cover-value">${escapeHtml(cover.title)}</span></div>
      <div class="cover-field"><span class="cover-label">Type</span><span class="cover-value">${escapeHtml(cover.typeLabel)}</span></div>
      <div class="cover-field"><span class="cover-label">Date</span><span class="cover-value">${escapeHtml(cover.dateLabel)}</span></div>
      <div class="cover-field"><span class="cover-label">Written by</span><span class="cover-value">${escapeHtml(cover.writtenBy)}</span></div>
      <div class="cover-field"><span class="cover-label">Project Type</span><span class="cover-value">${escapeHtml(cover.projectTypeLabel)}</span></div>
    </div>
    <div style="page-break-after: always;"></div>
  `;
}

/**
 * Build a quote references appendix section.
 */
function renderQuoteRefsHtml(document: GeneratedDocument): string {
  if (document.quoteRefs.length === 0) return '';

  const rows = document.quoteRefs
    .map((ref) => {
      const speaker = ref.speaker ? ` - ${escapeHtml(ref.speaker)}` : '';
      return `<div class="quote-ref"><strong>${escapeHtml(ref.label)}</strong>${speaker}: &ldquo;${escapeHtml(ref.text)}&rdquo;</div>`;
    })
    .join('\n');

  return `
    <div class="quote-references">
      <h2>Quote References</h2>
      ${rows}
    </div>
  `;
}

/**
 * Get CSS styles for the given layout profile.
 */
function getLayoutStyles(profile: string): string {
  const base = `
    body { font-family: 'Georgia', serif; color: #1a1a1a; line-height: 1.6; }
    .cover-page { padding: 2in 0; text-align: center; }
    .cover-field { margin-bottom: 0.5em; }
    .cover-label { font-weight: bold; display: block; font-size: 0.85em; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
    .cover-value { font-size: 1.2em; }
    .quote-ref { margin-bottom: 0.75em; padding-left: 1em; border-left: 2px solid #ccc; }
    h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
    blockquote { border-left: 3px solid #999; padding-left: 1em; color: #444; }
  `;

  if (profile === 'screenplay-document') {
    return (
      base +
      `
      body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; }
      .cover-page { text-align: center; padding: 3in 0; }
    `
    );
  }

  if (profile === 'coverage-report') {
    return (
      base +
      `
      body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
      h2 { border-bottom: 1px solid #333; padding-bottom: 0.25em; }
    `
    );
  }

  // professional-document
  return (
    base +
    `
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; }
  `
  );
}

/**
 * Render the full export HTML document from a GeneratedDocument.
 *
 * Produces a complete HTML string with cover page, styled body content,
 * and quote reference appendix suitable for PDF printing.
 */
export function renderDocumentHtml(document: GeneratedDocument): string {
  const profile = getLayoutProfile(document);
  const styles = getLayoutStyles(profile);
  const coverHtml = renderCoverHtml(document);
  const bodyHtml = renderContentToHtml(document.content);
  const quoteHtml = renderQuoteRefsHtml(document);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(document.title)}</title>
  <style>${styles}</style>
</head>
<body>
  ${coverHtml}
  <div class="document-body">
    ${bodyHtml}
  </div>
  ${quoteHtml}
</body>
</html>`;
}
