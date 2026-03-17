/**
 * Shared export request validation and filename helpers.
 *
 * Separates exporter internals from route exposure so that
 * PDF and DOCX consumers share the same contract.
 */

import { z } from 'zod';
import type { GeneratedDocument } from './types';

/**
 * Zod schema for validating a serialized GeneratedDocument payload
 * coming from an export request body.
 */
export const generatedDocumentSchema = z.object({
  id: z.string(),
  kind: z.enum(['report', 'outline', 'treatment', 'proposal']),
  projectType: z.string(),
  title: z.string(),
  writtenBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  outlineMode: z.enum(['beats', 'scene-by-scene']).optional(),
  cover: z.object({
    title: z.string(),
    typeLabel: z.string(),
    writtenBy: z.string(),
    dateLabel: z.string(),
    projectTypeLabel: z.string(),
  }),
  content: z.record(z.unknown()),
  quoteRefs: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      text: z.string(),
      speaker: z.string().optional(),
      sourceSection: z.enum([
        'summary',
        'keyQuotes',
        'recurringThemes',
        'keyMoments',
        'editorialNotes',
      ]),
    })
  ),
  sourceText: z.string(),
  analysisSnapshot: z.record(z.unknown()).optional(),
});

/**
 * Convert a document title into a safe, lowercase, hyphenated filename stem.
 *
 * "Wildlife Report: Season 2" -> "wildlife-report-season-2"
 */
export function toFilenameStem(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a full filename for the given document and format.
 */
export function getExportFilename(
  document: GeneratedDocument,
  format: 'pdf' | 'docx'
): string {
  const stem = toFilenameStem(document.title);
  return `${stem}.${format}`;
}
