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
  overallScore: z.number().optional().describe('Overall quality score from 1-10'),
  overallSummary: z.string().optional().describe('2-3 sentence overall assessment of the corporate material'),
  spokespersonAssessment: z.object({
    overallReadiness: z.enum(['camera-ready', 'needs-coaching', 'significant-prep-needed']),
    summary: z.string().describe('Overall assessment of spokesperson performance'),
    topPerformer: z.string().optional().describe('Name of the strongest performer if multiple speakers'),
  }).optional().describe('Overall spokesperson readiness assessment'),
  audienceAlignment: z.object({
    targetAudience: z.string().describe('Identified target audience for this content'),
    alignmentRating: z.enum(['strong', 'adequate', 'weak']),
    assessment: z.string().describe('How well the messaging resonates with the target audience'),
    suggestions: z.array(z.string()).describe('Ways to better align with audience expectations'),
  }).optional().describe('Audience alignment evaluation'),
  messageConsistency: z.object({
    consistencyRating: z.enum(['unified', 'mostly-consistent', 'mixed-signals', 'contradictory']),
    assessment: z.string().describe('How consistent messaging is across all speakers and segments'),
    keyConflicts: z.array(z.string()).optional().describe('Specific messaging conflicts or contradictions'),
  }).optional().describe('Cross-speaker message consistency evaluation'),
});

export type CorporateAnalysis = z.infer<typeof corporateAnalysisSchema>;
