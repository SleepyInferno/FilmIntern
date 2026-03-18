import { z } from 'zod';

export const tvEpisodicAnalysisSchema = z.object({
  episodeAnalysis: z.object({
    coldOpen: z.object({
      description: z
        .string()
        .describe('What happens in the cold open or teaser'),
      hookStrength: z.enum(['strong', 'adequate', 'weak']),
      notes: z
        .string()
        .describe('Editorial notes on the cold open effectiveness'),
    }),
    storyStrands: z.array(
      z.object({
        strand: z.enum(['a-story', 'b-story', 'c-story', 'runner']),
        description: z
          .string()
          .describe('What this story strand covers'),
        characters: z
          .array(z.string())
          .describe('Characters involved in this strand'),
        effectiveness: z.enum([
          'compelling',
          'serviceable',
          'underdeveloped',
        ]),
      })
    ),
    characterIntroductions: z.array(
      z.object({
        character: z.string().describe('Character name'),
        introMethod: z
          .string()
          .describe('How the character is introduced to the audience'),
        effectiveness: z.enum(['memorable', 'adequate', 'flat']),
      })
    ),
    episodeArc: z.object({
      setup: z
        .string()
        .describe('How the episode establishes its central question'),
      escalation: z
        .string()
        .describe('How complications build through the episode'),
      resolution: z
        .string()
        .describe('How the episode resolves or leaves threads open'),
      cliffhanger: z
        .string()
        .optional()
        .describe('End-of-episode hook if present'),
      pacing: z.enum(['tight', 'well-paced', 'uneven', 'slow']),
    }),
  }),
  overallScore: z.number().optional().describe('Overall quality score from 1-10'),
  overallSummary: z.string().optional().describe('2-3 sentence overall assessment of the TV/episodic material'),
  toneAndVoice: z.object({
    tone: z.string().describe('The dominant tone of the show'),
    voiceConsistency: z.enum(['distinctive', 'consistent', 'uneven', 'undefined']),
    assessment: z.string().describe('How the tone and voice serve the story'),
    comparisons: z.array(z.string()).optional().describe('Tonal comparisons to existing shows'),
  }).optional().describe('Tone and voice assessment'),
  pilotEffectiveness: z.object({
    worldBuilding: z.enum(['immersive', 'adequate', 'insufficient']),
    characterEstablishment: z.enum(['compelling', 'adequate', 'flat']),
    hookStrength: z.enum(['strong', 'adequate', 'weak']),
    assessment: z.string().describe('Overall pilot effectiveness evaluation'),
  }).optional().describe('Pilot episode effectiveness assessment'),
  franchisePotential: z.object({
    potential: z.enum(['high', 'moderate', 'limited']),
    assessment: z.string().describe('Franchise and expansion potential evaluation'),
    opportunities: z.array(z.string()).describe('Specific franchise opportunities (spinoffs, IP extension, etc.)'),
  }).optional().describe('Franchise and IP potential assessment'),
  seriesAnalysis: z.object({
    premiseLongevity: z.object({
      assessment: z.enum([
        'multi-season',
        'limited-series',
        'one-season',
        'questionable',
      ]),
      reasoning: z
        .string()
        .describe('Why this premise can or cannot sustain multiple seasons'),
    }),
    serializedHooks: z.array(
      z.object({
        hook: z
          .string()
          .describe('A serialized element that draws viewers back'),
        type: z.enum([
          'mystery',
          'relationship',
          'character-arc',
          'world-building',
          'conflict',
        ]),
        sustainability: z.enum(['strong', 'moderate', 'weak']),
      })
    ),
    episodicVsSerial: z.object({
      balance: z.enum([
        'mostly-episodic',
        'balanced',
        'mostly-serial',
        'fully-serial',
      ]),
      assessment: z
        .string()
        .describe('Whether the episodic/serial balance serves the show'),
    }),
    seasonArcPotential: z.object({
      suggestedArc: z
        .string()
        .describe('A potential season-long arc based on this material'),
      strengths: z
        .array(z.string())
        .describe('What supports a strong season arc'),
      concerns: z
        .array(z.string())
        .describe('Potential challenges for sustaining the season'),
    }),
  }),
});

export type TvEpisodicAnalysis = z.infer<typeof tvEpisodicAnalysisSchema>;
