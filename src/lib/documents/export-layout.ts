/**
 * Shared layout-profile selection for PDF and DOCX exporters.
 *
 * Returns a layout profile string that both export pipelines use
 * to apply consistent formatting rules per project type and document kind.
 */

import type { GeneratedDocument } from './types';

export type LayoutProfile =
  | 'screenplay-document'
  | 'coverage-report'
  | 'professional-document';

/**
 * Determine the layout profile for a document based on its project type and kind.
 *
 * - Narrative and TV-Episodic reports use `coverage-report` (studio coverage formatting)
 * - Narrative and TV-Episodic outlines/treatments use `screenplay-document` (screenplay-style layout)
 * - All other combinations use `professional-document` (clean professional formatting)
 */
export function getLayoutProfile(document: GeneratedDocument): LayoutProfile {
  const { projectType, kind } = document;

  if (projectType === 'narrative' || projectType === 'tv-episodic') {
    if (kind === 'report') {
      return 'coverage-report';
    }
    return 'screenplay-document';
  }

  return 'professional-document';
}
