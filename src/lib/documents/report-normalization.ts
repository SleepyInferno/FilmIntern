/**
 * Generic report normalization contract for Phase 4.
 *
 * Each Phase 3 analysis schema registers a normalizer that maps its
 * specific shape into Tiptap-compatible content nodes and quote refs.
 * buildReportDocument delegates through this registry instead of
 * branching on project type.
 */

import type { DocumentQuoteRef } from './types';
import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import type { CorporateAnalysis } from '@/lib/ai/schemas/corporate';
import type { NarrativeAnalysis } from '@/lib/ai/schemas/narrative';
import type { TvEpisodicAnalysis } from '@/lib/ai/schemas/tv-episodic';
import type { ShortFormAnalysis } from '@/lib/ai/schemas/short-form';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AnalysisReportKind =
  | 'documentary'
  | 'corporate'
  | 'narrative-structure'
  | 'narrative-coverage'
  | 'tv-episodic'
  | 'short-form';

export interface NormalizedReport {
  /** Tiptap-compatible JSON document */
  content: { type: 'doc'; content: TiptapNode[] };
  /** Extracted quote references with stable labels */
  quoteRefs: DocumentQuoteRef[];
}

export interface ReportNormalizer<TAnalysis = unknown> {
  normalize(analysis: TAnalysis): NormalizedReport;
}

// ---------------------------------------------------------------------------
// Tiptap node helpers
// ---------------------------------------------------------------------------

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

function heading(level: number, text: string): TiptapNode {
  return {
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text }],
  };
}

function paragraph(text: string): TiptapNode {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  };
}

function boldParagraph(label: string, value: string): TiptapNode {
  return {
    type: 'paragraph',
    content: [
      { type: 'text', text: label, marks: [{ type: 'bold' }] },
      { type: 'text', text: value },
    ],
  };
}

function bulletList(items: string[]): TiptapNode {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [paragraph(item)],
    })),
  };
}

// ---------------------------------------------------------------------------
// Normalizer: Documentary
// ---------------------------------------------------------------------------

const documentaryNormalizer: ReportNormalizer<DocumentaryAnalysis> = {
  normalize(analysis) {
    const nodes: TiptapNode[] = [];
    const quoteRefs: DocumentQuoteRef[] = [];

    // Summary
    nodes.push(heading(2, 'Summary'));
    nodes.push(paragraph(analysis.summary.overview));
    nodes.push(
      boldParagraph(
        'Interviewees: ',
        String(analysis.summary.intervieweeCount)
      )
    );
    nodes.push(
      boldParagraph(
        'Dominant Themes: ',
        analysis.summary.dominantThemes.join(', ')
      )
    );

    // Key Quotes
    nodes.push(heading(2, 'Key Quotes'));
    analysis.keyQuotes.forEach((q, i) => {
      const label = `Q${i + 1}`;
      quoteRefs.push({
        id: `quote-${i + 1}`,
        label,
        text: q.quote,
        speaker: q.speaker,
        sourceSection: 'keyQuotes',
      });
      nodes.push(
        boldParagraph(`[${label}] `, `"${q.quote}" -- ${q.speaker}`)
      );
      nodes.push(paragraph(`Context: ${q.context}`));
    });

    // Recurring Themes
    nodes.push(heading(2, 'Recurring Themes'));
    analysis.recurringThemes.forEach((t) => {
      nodes.push(heading(3, t.theme));
      nodes.push(paragraph(t.description));
      nodes.push(bulletList(t.evidence));
    });

    // Key Moments
    nodes.push(heading(2, 'Key Moments'));
    analysis.keyMoments.forEach((m) => {
      nodes.push(boldParagraph(`${m.moment}: `, m.significance));
    });

    // Editorial Notes
    nodes.push(heading(2, 'Editorial Notes'));
    nodes.push(
      boldParagraph(
        'Suggested Structure: ',
        analysis.editorialNotes.suggestedStructure
      )
    );
    if (analysis.editorialNotes.narrativeThreads.length > 0) {
      nodes.push(heading(3, 'Narrative Threads'));
      nodes.push(bulletList(analysis.editorialNotes.narrativeThreads));
    }
    if (analysis.editorialNotes.missingPerspectives.length > 0) {
      nodes.push(heading(3, 'Missing Perspectives'));
      nodes.push(bulletList(analysis.editorialNotes.missingPerspectives));
    }

    return { content: { type: 'doc', content: nodes }, quoteRefs };
  },
};

// ---------------------------------------------------------------------------
// Normalizer: Corporate
// ---------------------------------------------------------------------------

const corporateNormalizer: ReportNormalizer<CorporateAnalysis> = {
  normalize(analysis) {
    const nodes: TiptapNode[] = [];
    const quoteRefs: DocumentQuoteRef[] = [];

    // Summary
    nodes.push(heading(2, 'Summary'));
    nodes.push(paragraph(analysis.summary.overview));
    nodes.push(
      boldParagraph('Speakers: ', String(analysis.summary.speakerCount))
    );
    nodes.push(
      boldParagraph('Context: ', analysis.summary.primaryContext)
    );
    nodes.push(
      boldParagraph(
        'Key Messages: ',
        analysis.summary.dominantMessages.join(', ')
      )
    );

    // Soundbites
    nodes.push(heading(2, 'Soundbites'));
    analysis.soundbites.forEach((s, i) => {
      const label = `Q${i + 1}`;
      quoteRefs.push({
        id: `quote-${i + 1}`,
        label,
        text: s.quote,
        speaker: s.speaker,
        sourceSection: 'keyQuotes',
      });
      nodes.push(
        boldParagraph(`[${label}] `, `"${s.quote}" -- ${s.speaker}`)
      );
      nodes.push(paragraph(`Context: ${s.context}`));
    });

    // Messaging Themes
    nodes.push(heading(2, 'Messaging Themes'));
    analysis.messagingThemes.forEach((t) => {
      nodes.push(heading(3, t.theme));
      nodes.push(paragraph(t.description));
      nodes.push(bulletList(t.evidence));
    });

    // Speaker Effectiveness
    nodes.push(heading(2, 'Speaker Effectiveness'));
    analysis.speakerEffectiveness.forEach((s) => {
      nodes.push(heading(3, s.speaker));
      nodes.push(boldParagraph('Quotability: ', s.quotability));
      if (s.strengths.length > 0) {
        nodes.push(bulletList(s.strengths));
      }
    });

    // Editorial Notes
    nodes.push(heading(2, 'Editorial Notes'));
    nodes.push(
      boldParagraph(
        'Recommended Narrative: ',
        analysis.editorialNotes.recommendedNarrative
      )
    );
    nodes.push(
      boldParagraph(
        'Suggested Cuts: ',
        analysis.editorialNotes.suggestedCuts
      )
    );
    if (analysis.editorialNotes.messagingGaps.length > 0) {
      nodes.push(heading(3, 'Messaging Gaps'));
      nodes.push(bulletList(analysis.editorialNotes.messagingGaps));
    }

    return { content: { type: 'doc', content: nodes }, quoteRefs };
  },
};

// ---------------------------------------------------------------------------
// Normalizer: Narrative Structure
// ---------------------------------------------------------------------------

const narrativeStructureNormalizer: ReportNormalizer<NarrativeAnalysis> = {
  normalize(analysis) {
    const nodes: TiptapNode[] = [];
    const quoteRefs: DocumentQuoteRef[] = [];

    // Story Structure
    nodes.push(heading(2, 'Story Structure'));
    nodes.push(
      boldParagraph('Pacing: ', analysis.storyStructure.pacingAssessment)
    );
    nodes.push(
      boldParagraph('Tension Arc: ', analysis.storyStructure.tensionArc)
    );

    nodes.push(heading(3, 'Story Beats'));
    analysis.storyStructure.beats.forEach((b) => {
      nodes.push(
        boldParagraph(
          `${b.name} (${b.effectiveness}): `,
          b.description
        )
      );
    });

    if (analysis.storyStructure.structuralStrengths.length > 0) {
      nodes.push(heading(3, 'Structural Strengths'));
      nodes.push(bulletList(analysis.storyStructure.structuralStrengths));
    }
    if (analysis.storyStructure.structuralWeaknesses.length > 0) {
      nodes.push(heading(3, 'Structural Weaknesses'));
      nodes.push(bulletList(analysis.storyStructure.structuralWeaknesses));
    }

    // Notable dialogue lines as quote refs
    const notableLines =
      analysis.scriptCoverage.dialogueQuality.notableLines;
    notableLines.forEach((line, i) => {
      quoteRefs.push({
        id: `quote-${i + 1}`,
        label: `Q${i + 1}`,
        text: line,
        sourceSection: 'keyQuotes',
      });
    });

    return { content: { type: 'doc', content: nodes }, quoteRefs };
  },
};

// ---------------------------------------------------------------------------
// Normalizer: Narrative Coverage
// ---------------------------------------------------------------------------

const narrativeCoverageNormalizer: ReportNormalizer<NarrativeAnalysis> = {
  normalize(analysis) {
    const nodes: TiptapNode[] = [];
    const quoteRefs: DocumentQuoteRef[] = [];

    // Script Coverage
    nodes.push(heading(2, 'Script Coverage'));

    // Characters
    nodes.push(heading(3, 'Characters'));
    analysis.scriptCoverage.characters.forEach((c) => {
      nodes.push(boldParagraph(`${c.name} (${c.role}): `, c.arcAssessment));
    });

    // Conflict
    nodes.push(heading(3, 'Conflict Assessment'));
    nodes.push(
      boldParagraph(
        'Primary: ',
        analysis.scriptCoverage.conflictAssessment.primary
      )
    );
    if (analysis.scriptCoverage.conflictAssessment.secondary.length > 0) {
      nodes.push(
        bulletList(analysis.scriptCoverage.conflictAssessment.secondary)
      );
    }

    // Dialogue Quality
    nodes.push(heading(3, 'Dialogue Quality'));
    nodes.push(
      boldParagraph(
        'Overall: ',
        analysis.scriptCoverage.dialogueQuality.overall
      )
    );

    // Marketability
    nodes.push(heading(3, 'Marketability'));
    nodes.push(
      boldParagraph(
        'Suggested Logline: ',
        analysis.scriptCoverage.marketability.suggestedLogline
      )
    );
    nodes.push(
      boldParagraph(
        'Commercial Viability: ',
        analysis.scriptCoverage.marketability.commercialViability
      )
    );

    // Overall
    if (analysis.scriptCoverage.overallStrengths.length > 0) {
      nodes.push(heading(3, 'Overall Strengths'));
      nodes.push(bulletList(analysis.scriptCoverage.overallStrengths));
    }
    if (analysis.scriptCoverage.overallWeaknesses.length > 0) {
      nodes.push(heading(3, 'Overall Weaknesses'));
      nodes.push(bulletList(analysis.scriptCoverage.overallWeaknesses));
    }

    // Notable dialogue lines as quote refs
    const notableLines =
      analysis.scriptCoverage.dialogueQuality.notableLines;
    notableLines.forEach((line, i) => {
      quoteRefs.push({
        id: `quote-${i + 1}`,
        label: `Q${i + 1}`,
        text: line,
        sourceSection: 'keyQuotes',
      });
    });

    return { content: { type: 'doc', content: nodes }, quoteRefs };
  },
};

// ---------------------------------------------------------------------------
// Normalizer: TV / Episodic
// ---------------------------------------------------------------------------

const tvEpisodicNormalizer: ReportNormalizer<TvEpisodicAnalysis> = {
  normalize(analysis) {
    const nodes: TiptapNode[] = [];
    const quoteRefs: DocumentQuoteRef[] = [];

    // Episode Analysis
    nodes.push(heading(2, 'Episode Analysis'));

    // Cold Open
    nodes.push(heading(3, 'Cold Open'));
    nodes.push(paragraph(analysis.episodeAnalysis.coldOpen.description));
    nodes.push(
      boldParagraph(
        'Hook Strength: ',
        analysis.episodeAnalysis.coldOpen.hookStrength
      )
    );

    // Story Strands
    nodes.push(heading(3, 'Story Strands'));
    analysis.episodeAnalysis.storyStrands.forEach((s) => {
      nodes.push(
        boldParagraph(`${s.strand} (${s.effectiveness}): `, s.description)
      );
    });

    // Episode Arc
    nodes.push(heading(3, 'Episode Arc'));
    nodes.push(
      boldParagraph('Setup: ', analysis.episodeAnalysis.episodeArc.setup)
    );
    nodes.push(
      boldParagraph(
        'Escalation: ',
        analysis.episodeAnalysis.episodeArc.escalation
      )
    );
    nodes.push(
      boldParagraph(
        'Resolution: ',
        analysis.episodeAnalysis.episodeArc.resolution
      )
    );
    nodes.push(
      boldParagraph(
        'Pacing: ',
        analysis.episodeAnalysis.episodeArc.pacing
      )
    );

    // Series Analysis
    nodes.push(heading(2, 'Series Analysis'));
    nodes.push(
      boldParagraph(
        'Premise Longevity: ',
        analysis.seriesAnalysis.premiseLongevity.assessment
      )
    );
    nodes.push(paragraph(analysis.seriesAnalysis.premiseLongevity.reasoning));

    // Serialized Hooks
    if (analysis.seriesAnalysis.serializedHooks.length > 0) {
      nodes.push(heading(3, 'Serialized Hooks'));
      analysis.seriesAnalysis.serializedHooks.forEach((h) => {
        nodes.push(boldParagraph(`${h.type}: `, h.hook));
      });
    }

    // Season Arc
    nodes.push(heading(3, 'Season Arc Potential'));
    nodes.push(
      paragraph(analysis.seriesAnalysis.seasonArcPotential.suggestedArc)
    );

    return { content: { type: 'doc', content: nodes }, quoteRefs };
  },
};

// ---------------------------------------------------------------------------
// Normalizer: Short-form
// ---------------------------------------------------------------------------

const shortFormNormalizer: ReportNormalizer<ShortFormAnalysis> = {
  normalize(analysis) {
    const nodes: TiptapNode[] = [];
    const quoteRefs: DocumentQuoteRef[] = [];

    // Summary
    nodes.push(heading(2, 'Summary'));
    nodes.push(paragraph(analysis.summary.overview));
    nodes.push(
      boldParagraph('Format: ', analysis.summary.detectedFormat)
    );
    nodes.push(
      boldParagraph(
        'Estimated Duration: ',
        analysis.summary.estimatedDuration
      )
    );
    nodes.push(
      boldParagraph('Objective: ', analysis.summary.primaryObjective)
    );

    // Hook Strength
    nodes.push(heading(2, 'Hook Strength'));
    nodes.push(paragraph(analysis.hookStrength.opening));
    nodes.push(
      boldParagraph('Rating: ', analysis.hookStrength.hookRating)
    );
    nodes.push(
      boldParagraph('Time to Hook: ', analysis.hookStrength.timeToHook)
    );

    // Pacing
    nodes.push(heading(2, 'Pacing'));
    nodes.push(
      boldParagraph('Overall: ', analysis.pacing.overall)
    );
    nodes.push(paragraph(analysis.pacing.assessment));

    // Messaging Clarity
    nodes.push(heading(2, 'Messaging Clarity'));
    nodes.push(
      boldParagraph(
        'Primary Message: ',
        analysis.messagingClarity.primaryMessage
      )
    );
    nodes.push(
      boldParagraph('Clarity: ', analysis.messagingClarity.clarity)
    );

    // CTA Effectiveness
    nodes.push(heading(2, 'CTA Effectiveness'));
    nodes.push(
      boldParagraph('Placement: ', analysis.ctaEffectiveness.placement)
    );
    nodes.push(
      boldParagraph('Urgency: ', analysis.ctaEffectiveness.urgency)
    );

    return { content: { type: 'doc', content: nodes }, quoteRefs };
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const reportNormalizers: Record<
  AnalysisReportKind,
  ReportNormalizer<any>
> = {
  documentary: documentaryNormalizer,
  corporate: corporateNormalizer,
  'narrative-structure': narrativeStructureNormalizer,
  'narrative-coverage': narrativeCoverageNormalizer,
  'tv-episodic': tvEpisodicNormalizer,
  'short-form': shortFormNormalizer,
};
