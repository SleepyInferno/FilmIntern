import { z } from 'zod';

export const narrativeAnalysisSchema = z.object({
  storyAngle: z
    .string()
    .describe('What this story is really about underneath the plot — one precise, earned sentence'),
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
      .describe('Overall assessment of the scripts pacing and emotional momentum'),
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
        roleFunction: z
          .string()
          .optional()
          .describe('Dramatic function label — e.g. emotional anchor, truth catalyst, mirror character, destabilizer'),
        arcAssessment: z
          .string()
          .describe('Assessment of this characters arc and development'),
        innerConflict: z
          .string()
          .optional()
          .describe('The internal tension driving this character'),
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
  themes: z.object({
    centralThemes: z
      .array(z.string())
      .describe('The main thematic pillars and underlying messages of the script'),
    emotionalResonance: z
      .string()
      .describe('How effectively the script delivers emotional impact — what feelings it evokes and whether they land'),
    audienceImpact: z
      .string()
      .describe('The likely intellectual and emotional effect on viewers — what they will take away'),
  }),
  developmentRecommendations: z
    .array(z.string())
    .describe('Priority-ordered actionable recommendations for the next draft — concrete, specific, and sequenced from most to least critical'),
  verdict: z.object({
    concept: z.string().describe('Verbal rating of the concept strength — e.g. Very Strong, Strong, Adequate, Needs Work'),
    execution: z.string().describe('Verbal rating of script execution quality'),
    dialogue: z.string().describe('Verbal rating of dialogue quality'),
    characters: z.string().describe('Verbal rating of character work'),
    marketability: z.string().describe('Verbal rating of commercial or festival potential — e.g. High for festival circuit, Limited commercial appeal'),
    overall: z.string().describe('Concise overall verdict useful for creative decision-making'),
  }).optional(),
  overallScore: z.number().optional().describe('Overall quality score from 1-10'),
  overallSummary: z.string().optional().describe('2-3 sentence overall assessment of the script'),
});

export type NarrativeAnalysis = z.infer<typeof narrativeAnalysisSchema>;
