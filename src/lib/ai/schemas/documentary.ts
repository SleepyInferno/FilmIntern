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
});

export type DocumentaryAnalysis = z.infer<typeof documentaryAnalysisSchema>;
