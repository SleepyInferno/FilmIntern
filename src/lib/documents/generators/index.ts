/**
 * Document generation engine.
 * Builds GeneratedDocument records with Tiptap JSON content,
 * project-type-specific covers, and quote references.
 */

import { generateText } from 'ai';
import { loadSettings } from '@/lib/ai/settings';
import { buildRegistry } from '@/lib/ai/provider-registry';
import type {
  GeneratedDocument,
  DocumentCover,
  DocumentKind,
  OutlineMode,
  DocumentQuoteRef,
} from '../types';
import { PROJECT_TYPES } from '@/lib/types/project-types';
import {
  buildOutlinePrompt,
  buildTreatmentPrompt,
  buildProposalPrompt,
} from './prompts';

export interface GenerateDocumentInput {
  projectType: string;
  documentKind: Exclude<DocumentKind, 'report'>;
  sourceText: string;
  title: string;
  writtenBy: string;
  analysis: Record<string, unknown>;
  outlineMode?: OutlineMode;
}

function getTypeLabel(kind: Exclude<DocumentKind, 'report'>): string {
  switch (kind) {
    case 'outline':
      return 'Outline';
    case 'treatment':
      return 'Treatment';
    case 'proposal':
      return 'Strategic Proposal';
  }
}

function buildPrompt(input: GenerateDocumentInput): string {
  switch (input.documentKind) {
    case 'outline':
      return buildOutlinePrompt(
        input.sourceText,
        input.analysis,
        input.outlineMode
      );
    case 'treatment':
      return buildTreatmentPrompt(input.sourceText, input.analysis);
    case 'proposal':
      return buildProposalPrompt(input.sourceText, input.analysis);
  }
}

function extractQuoteRefs(
  analysis: Record<string, unknown>
): DocumentQuoteRef[] {
  const refs: DocumentQuoteRef[] = [];

  // Extract from documentary keyQuotes
  const keyQuotes = analysis.keyQuotes as
    | Array<{ quote: string; speaker?: string }>
    | undefined;
  if (Array.isArray(keyQuotes)) {
    keyQuotes.forEach((q, i) => {
      refs.push({
        id: `quote-${i + 1}`,
        label: `Q${i + 1}`,
        text: q.quote,
        speaker: q.speaker,
        sourceSection: 'keyQuotes',
      });
    });
  }

  // Extract from corporate soundbites
  const soundbites = analysis.soundbites as
    | Array<{ quote: string; speaker?: string }>
    | undefined;
  if (Array.isArray(soundbites) && refs.length === 0) {
    soundbites.forEach((s, i) => {
      refs.push({
        id: `quote-${i + 1}`,
        label: `Q${i + 1}`,
        text: s.quote,
        speaker: s.speaker,
        sourceSection: 'keyQuotes',
      });
    });
  }

  return refs;
}

export async function generateDocument(
  input: GenerateDocumentInput
): Promise<GeneratedDocument> {
  const settings = await loadSettings();
  const registry = buildRegistry(
    settings.ollama.baseURL,
    settings.anthropic.apiKey || undefined,
    settings.openai.apiKey || undefined,
  );
  const modelId = (
    {
      anthropic: `anthropic:${settings.anthropic.model}`,
      openai: `openai:${settings.openai.model}`,
      ollama: `ollama:${settings.ollama.model}`,
    } as const
  )[settings.provider];

  const prompt = buildPrompt(input);

  let content: Record<string, unknown>;
  try {
    const result = await generateText({
      model: registry.languageModel(modelId),
      system:
        'You generate structured documents in Tiptap JSON format. Always return valid JSON.',
      prompt,
      ...(settings.provider === 'anthropic'
        ? {
            providerOptions: {
              anthropic: { structuredOutputMode: 'auto' },
            },
          }
        : {}),
    });

    // Try to parse the response as JSON
    const text = result.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback: wrap the text in a basic Tiptap document
      content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text }],
          },
        ],
      };
    }
  } catch {
    // On AI error, return a placeholder document
    content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Document generation encountered an error. Please try again.',
            },
          ],
        },
      ],
    };
  }

  const now = new Date().toISOString();
  const projectConfig = PROJECT_TYPES[input.projectType];
  const projectTypeLabel = projectConfig?.label ?? input.projectType;

  const cover: DocumentCover = {
    title: input.title,
    typeLabel: getTypeLabel(input.documentKind),
    writtenBy: input.writtenBy,
    dateLabel: now,
    projectTypeLabel,
  };

  const quoteRefs = extractQuoteRefs(input.analysis);

  return {
    id: crypto.randomUUID(),
    kind: input.documentKind,
    projectType: input.projectType,
    title: input.title,
    writtenBy: input.writtenBy,
    createdAt: now,
    updatedAt: now,
    outlineMode: input.outlineMode,
    cover,
    content,
    quoteRefs,
    sourceText: input.sourceText,
    analysisSnapshot: input.analysis,
  };
}
