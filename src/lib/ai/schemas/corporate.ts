import { z } from 'zod';

export const corporateAnalysisSchema = z.object({
  summary: z.object({
    overview: z
      .string()
      .describe('2-3 sentence executive summary of the corporate material'),
    speakerCount: z
      .number()
      .describe('Number of distinct speakers identified'),
    primaryContext: z
      .enum(['brand-marketing', 'internal-comms', 'executive-interview', 'mixed'])
      .describe('Detected context type based on content'),
    dominantMessages: z
      .array(z.string())
      .describe('Top 3-5 key messages across all speakers'),
  }),
  soundbites: z
    .array(
      z.object({
        quote: z
          .string()
          .describe('Exact verbatim quote from the transcript'),
        speaker: z.string().describe('Speaker name or identifier'),
        context: z
          .string()
          .describe('Why this soundbite is usable for the final piece'),
        category: z.enum([
          'key-message',
          'emotional',
          'data-point',
          'vision-statement',
          'call-to-action',
        ]),
        usability: z.enum(['hero-quote', 'strong', 'supporting']),
      })
    )
    .describe('8-15 most usable soundbites ranked by editorial value'),
  messagingThemes: z.array(
    z.object({
      theme: z.string(),
      description: z
        .string()
        .describe('What this messaging theme communicates'),
      evidence: z
        .array(z.string())
        .describe('2-3 brief quote excerpts supporting this theme'),
      consistency: z.enum([
        'unified',
        'mostly-consistent',
        'mixed-signals',
        'contradictory',
      ]),
    })
  ),
  speakerEffectiveness: z.array(
    z.object({
      speaker: z.string().describe('Speaker name or identifier'),
      strengths: z
        .array(z.string())
        .describe('What this speaker does well on camera'),
      areasForImprovement: z
        .array(z.string())
        .describe('Where this speaker could improve'),
      quotability: z.enum(['highly-quotable', 'adequate', 'needs-coaching']),
      onMessageScore: z.enum([
        'on-message',
        'partially-aligned',
        'off-message',
      ]),
    })
  ),
  editorialNotes: z.object({
    recommendedNarrative: z
      .string()
      .describe('Suggested narrative arc for the final edit'),
    messagingGaps: z
      .array(z.string())
      .describe('Key messages that are missing or underrepresented'),
    suggestedCuts: z
      .string()
      .describe('Brief editing recommendations for the strongest cut'),
  }),
});

export type CorporateAnalysis = z.infer<typeof corporateAnalysisSchema>;
