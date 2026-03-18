import { z } from 'zod';

export const documentaryAnalysisSchema = z.object({
  summary: z.object({
    overview: z
      .string()
      .describe('2-3 sentence executive summary of the transcript'),
    intervieweeCount: z
      .number()
      .describe('Number of distinct speakers identified'),
    dominantThemes: z.array(z.string()).describe('Top 3-5 themes'),
    totalQuotesExtracted: z.number(),
  }),
  keyQuotes: z
    .array(
      z.object({
        quote: z
          .string()
          .describe('Exact verbatim quote from the transcript'),
        speaker: z.string().describe('Speaker name or identifier'),
        context: z
          .string()
          .describe('Why this quote matters for the documentary'),
        category: z.enum([
          'emotional',
          'informational',
          'contradictory',
          'humorous',
          'revealing',
        ]),
        usefulness: z.enum(['must-use', 'strong', 'supporting']),
      })
    )
    .describe('8-15 best quotes ranked by editorial value'),
  recurringThemes: z.array(
    z.object({
      theme: z.string(),
      description: z
        .string()
        .describe('What this theme means in context'),
      evidence: z
        .array(z.string())
        .describe('2-3 brief quote excerpts supporting this theme'),
      frequency: z.enum(['dominant', 'recurring', 'emerging']),
    })
  ),
  keyMoments: z.array(
    z.object({
      moment: z.string().describe('Description of the moment'),
      significance: z
        .string()
        .describe('Why a documentary editor would flag this'),
      approximateLocation: z
        .string()
        .describe('Rough position in transcript: early/middle/late'),
      type: z.enum([
        'turning-point',
        'emotional-peak',
        'revelation',
        'contradiction',
        'humor',
      ]),
    })
  ),
  editorialNotes: z.object({
    narrativeThreads: z
      .array(z.string())
      .describe('Potential story threads a documentarian could follow'),
    missingPerspectives: z
      .array(z.string())
      .describe('Gaps or viewpoints not represented'),
    suggestedStructure: z
      .string()
      .describe(
        'Brief suggestion for how to structure the documentary based on this material'
      ),
  }),
  overallScore: z.number().optional().describe('Overall quality score from 1-10'),
  overallSummary: z.string().optional().describe('2-3 sentence overall assessment of the documentary material'),
  subjectProfiles: z.array(z.object({
    name: z.string().describe('Subject/interviewee name or identifier'),
    role: z.string().describe('Their role or relationship to the story'),
    keyContribution: z.string().describe('What they uniquely bring to the documentary'),
    quotability: z.enum(['highly-quotable', 'adequate', 'needs-coaching']),
  })).optional().describe('Profile summary of each interview subject'),
  storyArc: z.object({
    assessment: z.string().describe('Assessment of the overall narrative arc potential from this material'),
    suggestedStructure: z.string().describe('Recommended documentary structure (chronological, thematic, character-driven, etc.)'),
    strengths: z.array(z.string()).describe('What supports a strong documentary arc'),
    gaps: z.array(z.string()).describe('Where the arc has holes or needs additional material'),
  }).optional().describe('Story arc assessment for the documentary'),
});

export type DocumentaryAnalysis = z.infer<typeof documentaryAnalysisSchema>;
