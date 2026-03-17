import { PROJECT_TYPES } from '@/lib/types/project-types';
import { supportsDocumentKind, getOutlineModes } from '@/lib/documents/availability';
import { generateDocument } from '@/lib/documents/generators';
import type { DocumentKind, OutlineMode } from '@/lib/documents/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();

  const {
    projectType,
    documentKind,
    sourceText,
    title,
    writtenBy,
    analysis,
    outlineMode,
  } = body as {
    projectType: string;
    documentKind: DocumentKind;
    sourceText: string;
    title: string;
    writtenBy: string;
    analysis: Record<string, unknown>;
    outlineMode?: OutlineMode;
  };

  // Validate project type
  if (!(projectType in PROJECT_TYPES)) {
    return Response.json(
      { error: 'Unsupported project type' },
      { status: 400 }
    );
  }

  // Validate document kind availability
  if (documentKind === 'report' || !supportsDocumentKind(projectType, documentKind)) {
    return Response.json(
      { error: 'Document kind not available for project type' },
      { status: 400 }
    );
  }

  // Validate outline mode
  if (outlineMode === 'scene-by-scene') {
    const allowedModes = getOutlineModes(projectType);
    if (!allowedModes.includes('scene-by-scene')) {
      return Response.json(
        { error: 'Outline mode not allowed for project type' },
        { status: 400 }
      );
    }
  }

  try {
    const document = await generateDocument({
      projectType,
      documentKind: documentKind as Exclude<DocumentKind, 'report'>,
      sourceText,
      title,
      writtenBy,
      analysis,
      outlineMode,
    });

    return Response.json(document);
  } catch (error) {
    console.error('Document generation error:', error);
    return Response.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}
