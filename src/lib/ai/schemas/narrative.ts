import { z } from 'zod';

export const narrativeAnalysisSchema = z.object({
  storyStructure: z.object({
    beats: z.array(
      z.object({
        name: z.enum([
          'inciting-incident',
          'midpoint',
          'act-2-break',
          'dark-night-of-the-soul',
          'climax',
          'resolution',
        ]),
        description: z
          .string()
          .describe('What happens at this beat'),
        approximatePosition: z
          .string()
          .describe('Page number or early/middle/late position'),
        effectiveness: z.enum(['strong', 'adequate', 'weak', 'missing']),
      })
    ),
    pacingAssessment: z
      .string()
      .describe('Overall assessment of the scripts pacing and rhythm'),
    tensionArc: z
      .string()
      .describe('How tension builds, sustains, and releases across the script'),
    structuralStrengths: z
      .array(z.string())
      .describe('What works structurally'),
    structuralWeaknesses: z
      .array(z.string())
      .describe('Structural issues that need attention'),
  }),
  scriptCoverage: z.object({
    characters: z.array(
      z.object({
        name: z.string().describe('Character name'),
        role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']),
        arcAssessment: z
          .string()
          .describe('Assessment of this characters arc and development'),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
      })
    ),
    conflictAssessment: z.object({
      primary: z
        .string()
        .describe('The central dramatic conflict'),
      secondary: z
        .array(z.string())
        .describe('Supporting conflicts and subplots'),
      effectiveness: z.enum(['compelling', 'adequate', 'underdeveloped']),
    }),
    dialogueQuality: z.object({
      overall: z.enum(['sharp', 'serviceable', 'needs-work']),
      strengths: z
        .array(z.string())
        .describe('What works in the dialogue'),
      weaknesses: z
        .array(z.string())
        .describe('Dialogue issues to address'),
      notableLines: z
        .array(z.string())
        .describe('Standout lines worth highlighting'),
    }),
    marketability: z.object({
      loglineQuality: z.enum(['strong', 'adequate', 'weak']),
      suggestedLogline: z
        .string()
        .describe('A suggested one-sentence logline'),
      compTitles: z
        .array(z.string())
        .describe('2-3 comparable films for positioning'),
      commercialViability: z.enum(['high', 'moderate', 'limited', 'niche']),
    }),
    overallStrengths: z
      .array(z.string())
      .describe('What is working dramatically in this script'),
    overallWeaknesses: z
      .array(z.string())
      .describe('What needs revision or rethinking'),
  }),
});

export type NarrativeAnalysis = z.infer<typeof narrativeAnalysisSchema>;
