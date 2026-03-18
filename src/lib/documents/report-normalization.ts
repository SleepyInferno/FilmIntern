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

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AnalysisReportKind =
  | 'documentary'
  | 'corporate'
  | 'narrative-structure'
  | 'narrative-coverage'
  | 'tv-episodic';

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
// Normalizer: Narrative (all 8 evaluation categories)
// ---------------------------------------------------------------------------

function formatBeatName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const narrativeStructureNormalizer: ReportNormalizer<NarrativeAnalysis> = {
  normalize(analysis) {
    const nodes: TiptapNode[] = [];

    // 1. Logline & Premise Clarity
    nodes.push(heading(2, '1. Logline & Premise Clarity'));
    const mkt = analysis.scriptCoverage.marketability;
    nodes.push(boldParagraph('Logline Quality: ', mkt.loglineQuality));
    if (mkt.suggestedLogline) {
      nodes.push(boldParagraph('Suggested Logline: ', mkt.suggestedLogline));
    }

    // 2. Story Structure / Act Breakdown
    nodes.push(heading(2, '2. Story Structure / Act Breakdown'));
    analysis.storyStructure.beats.forEach((b) => {
      nodes.push(
        boldParagraph(`${formatBeatName(b.name)} [${b.effectiveness}]: `, b.description)
      );
      nodes.push(paragraph(`Position: ${b.approximatePosition}`));
    });
    if (analysis.storyStructure.structuralStrengths.length > 0) {
      nodes.push(heading(3, 'Structural Strengths'));
      nodes.push(bulletList(analysis.storyStructure.structuralStrengths));
    }
    if (analysis.storyStructure.structuralWeaknesses.length > 0) {
      nodes.push(heading(3, 'Structural Weaknesses'));
      nodes.push(bulletList(analysis.storyStructure.structuralWeaknesses));
    }

    // 3. Character Arcs & Development
    nodes.push(heading(2, '3. Character Arcs & Development'));
    analysis.scriptCoverage.characters.forEach((c) => {
      nodes.push(boldParagraph(`${c.name} (${c.role}): `, c.arcAssessment));
      if (c.strengths.length > 0) nodes.push(bulletList(c.strengths.map((s) => `+ ${s}`)));
      if (c.weaknesses.length > 0) nodes.push(bulletList(c.weaknesses.map((w) => `- ${w}`)));
    });

    // 4. Dialogue & Voice
    nodes.push(heading(2, '4. Dialogue & Voice'));
    const dq = analysis.scriptCoverage.dialogueQuality;
    nodes.push(boldParagraph('Overall: ', dq.overall));
    if (dq.strengths.length > 0) {
      nodes.push(heading(3, 'Strengths'));
      nodes.push(bulletList(dq.strengths));
    }
    if (dq.weaknesses.length > 0) {
      nodes.push(heading(3, 'Weaknesses'));
      nodes.push(bulletList(dq.weaknesses));
    }
    if (dq.notableLines && dq.notableLines.length > 0) {
      nodes.push(heading(3, 'Notable Lines'));
      nodes.push(bulletList(dq.notableLines.map((l) => `"${l}"`)));
    }

    // 5. Theme & Emotional Resonance
    nodes.push(heading(2, '5. Theme & Emotional Resonance'));
    if (analysis.themes) {
      if (analysis.themes.centralThemes?.length > 0) {
        nodes.push(boldParagraph('Central Themes: ', analysis.themes.centralThemes.join(', ')));
      }
      if (analysis.themes.emotionalResonance) {
        nodes.push(boldParagraph('Emotional Resonance: ', analysis.themes.emotionalResonance));
      }
      if (analysis.themes.audienceImpact) {
        nodes.push(boldParagraph('Audience Impact: ', analysis.themes.audienceImpact));
      }
    }

    // 6. Pacing & Tension
    nodes.push(heading(2, '6. Pacing & Tension'));
    nodes.push(boldParagraph('Pacing: ', analysis.storyStructure.pacingAssessment));
    nodes.push(boldParagraph('Tension Arc: ', analysis.storyStructure.tensionArc));

    // 7. Genre Positioning & Comparables
    nodes.push(heading(2, '7. Genre Positioning & Comparables'));
    if (mkt.compTitles?.length > 0) {
      nodes.push(boldParagraph('Comp Titles: ', mkt.compTitles.join(', ')));
    }
    nodes.push(boldParagraph('Commercial Viability: ', mkt.commercialViability));
    const conflict = analysis.scriptCoverage.conflictAssessment;
    nodes.push(boldParagraph('Primary Conflict: ', conflict.primary));
    if (conflict.secondary.length > 0) {
      nodes.push(bulletList(conflict.secondary));
    }

    // 8. Development Recommendations
    nodes.push(heading(2, '8. Development Recommendations'));
    if (analysis.developmentRecommendations?.length > 0) {
      nodes.push(bulletList(analysis.developmentRecommendations));
    }
    if (analysis.scriptCoverage.overallStrengths.length > 0) {
      nodes.push(heading(3, 'Overall Strengths'));
      nodes.push(bulletList(analysis.scriptCoverage.overallStrengths));
    }
    if (analysis.scriptCoverage.overallWeaknesses.length > 0) {
      nodes.push(heading(3, 'Overall Weaknesses'));
      nodes.push(bulletList(analysis.scriptCoverage.overallWeaknesses));
    }

    return { content: { type: 'doc', content: nodes }, quoteRefs: [] };
  },
};

// narrativeCoverageNormalizer kept for registry completeness (unused by page.tsx)
const narrativeCoverageNormalizer: ReportNormalizer<NarrativeAnalysis> = {
  normalize(analysis) {
    return narrativeStructureNormalizer.normalize(analysis);
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
};
