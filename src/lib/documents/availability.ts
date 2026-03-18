import { PROJECT_TYPES } from '@/lib/types/project-types';
import type { DocumentKind, OutlineMode } from './types';

/**
 * Project-type-to-document-kind availability matrix.
 * Centralized so downstream UI, generation, and export code
 * all share one source of truth for which documents are offered.
 */
const DOCUMENT_KIND_MATRIX: Record<string, DocumentKind[]> = {
  documentary: ['report', 'outline', 'proposal'],
  corporate: ['report', 'outline', 'proposal'],
  narrative: ['report', 'outline', 'treatment'],
  'tv-episodic': ['report', 'outline', 'treatment'],
};

/**
 * Which outline modes each project type supports.
 * Narrative and TV/episodic get scene-by-scene in addition to beats.
 */
const OUTLINE_MODE_MATRIX: Record<string, OutlineMode[]> = {
  documentary: ['beats'],
  corporate: ['beats'],
  narrative: ['beats', 'scene-by-scene'],
  'tv-episodic': ['beats', 'scene-by-scene'],
};

function assertKnownProjectType(projectType: string): void {
  if (!(projectType in PROJECT_TYPES)) {
    throw new Error('Unknown project type: ' + projectType);
  }
}

/**
 * Returns the document kinds available for a given project type.
 */
export function getAvailableDocumentKinds(
  projectType: string
): DocumentKind[] {
  assertKnownProjectType(projectType);
  return DOCUMENT_KIND_MATRIX[projectType];
}

/**
 * Returns the outline modes available for a given project type.
 */
export function getOutlineModes(projectType: string): OutlineMode[] {
  assertKnownProjectType(projectType);
  return OUTLINE_MODE_MATRIX[projectType];
}

/**
 * Returns whether a project type supports a specific document kind.
 */
export function supportsDocumentKind(
  projectType: string,
  kind: DocumentKind
): boolean {
  assertKnownProjectType(projectType);
  return DOCUMENT_KIND_MATRIX[projectType].includes(kind);
}
