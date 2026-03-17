export type DocumentKind = 'report' | 'outline' | 'treatment' | 'proposal';

export type OutlineMode = 'beats' | 'scene-by-scene';

export type ExportFormat = 'pdf' | 'docx';

export interface DocumentQuoteRef {
  id: string;
  label: string;
  text: string;
  speaker?: string;
  sourceSection:
    | 'summary'
    | 'keyQuotes'
    | 'recurringThemes'
    | 'keyMoments'
    | 'editorialNotes';
}

export interface DocumentCover {
  title: string;
  typeLabel: string;
  writtenBy: string;
  dateLabel: string;
  projectTypeLabel: string;
}

export interface GeneratedDocument {
  id: string;
  kind: DocumentKind;
  projectType: string;
  title: string;
  writtenBy: string;
  createdAt: string;
  updatedAt: string;
  outlineMode?: OutlineMode;
  cover: DocumentCover;
  content: Record<string, unknown>;
  quoteRefs: DocumentQuoteRef[];
  sourceText: string;
  analysisSnapshot?: Record<string, unknown>;
}
