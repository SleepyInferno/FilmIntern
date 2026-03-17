/**
 * Converts supported analysis payloads into GeneratedDocument report records.
 *
 * Delegates section assembly, quote extraction, and cover labeling through
 * the reportNormalizers registry. Documentary is one adapter entry, not
 * the default implementation.
 */

import type { GeneratedDocument, DocumentCover } from './types';
import {
  type AnalysisReportKind,
  reportNormalizers,
} from './report-normalization';
import { PROJECT_TYPES } from '@/lib/types/project-types';

export interface BuildReportDocumentInput {
  reportKind: AnalysisReportKind;
  projectType: string;
  analysis: unknown;
  sourceText: string;
  title: string;
  writtenBy: string;
  createdAt?: string;
}

/**
 * Build a GeneratedDocument with kind 'report' from any supported analysis payload.
 */
export function buildReportDocument(
  input: BuildReportDocumentInput
): GeneratedDocument {
  const {
    reportKind,
    projectType,
    analysis,
    sourceText,
    title,
    writtenBy,
    createdAt,
  } = input;

  const normalizer = reportNormalizers[reportKind];
  if (!normalizer) {
    throw new Error(`No normalizer registered for report kind: ${reportKind}`);
  }

  const { content, quoteRefs } = normalizer.normalize(analysis);

  const now = createdAt || new Date().toISOString();
  const projectConfig = PROJECT_TYPES[projectType];
  const projectTypeLabel = projectConfig?.label ?? projectType;

  const cover: DocumentCover = {
    title,
    typeLabel: 'Analysis Report',
    writtenBy,
    dateLabel: now,
    projectTypeLabel,
  };

  return {
    id: `report-${reportKind}-${Date.now()}`,
    kind: 'report',
    projectType,
    title,
    writtenBy,
    createdAt: now,
    updatedAt: now,
    outlineMode: undefined,
    cover,
    content: content as unknown as Record<string, unknown>,
    quoteRefs,
    sourceText,
    analysisSnapshot: analysis as Record<string, unknown>,
  };
}
