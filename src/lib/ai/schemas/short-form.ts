import { z } from 'zod';

export const shortFormAnalysisSchema = z.object({
  summary: z.object({
    overview: z
      .string()
      .describe('2-3 sentence executive summary of the short-form content'),
    detectedFormat: z.enum([
      'brand-hero',
      'social-ad',
      'explainer',
      'event-recap',
      'mixed',
    ]),
    estimatedDuration: z
      .string()
      .describe('Estimated runtime based on script/content length'),
    primaryObjective: z
      .string()
      .describe('The primary goal this content is trying to achieve'),
  }),
  hookStrength: z.object({
    opening: z
      .string()
      .describe('What the opening does to capture attention'),
    hookRating: z.enum(['scroll-stopping', 'adequate', 'weak']),
    timeToHook: z
      .string()
      .describe('How quickly the content grabs attention'),
    suggestions: z
      .array(z.string())
      .describe('Ways to strengthen the opening hook'),
  }),
  pacing: z.object({
    overall: z.enum(['tight', 'well-paced', 'uneven', 'slow']),
    assessment: z
      .string()
      .describe('Detailed assessment of the content pacing'),
    deadSpots: z
      .array(z.string())
      .describe('Moments where energy or attention drops'),
    recommendations: z
      .array(z.string())
      .describe('Specific pacing improvements'),
  }),
  messagingClarity: z.object({
    primaryMessage: z
      .string()
      .describe('The single core message the content communicates'),
    clarity: z.enum(['crystal-clear', 'mostly-clear', 'muddled', 'unclear']),
    messageRetention: z
      .string()
      .describe('Will the viewer remember the key message after watching?'),
    improvements: z
      .array(z.string())
      .describe('Ways to sharpen the messaging'),
  }),
  ctaEffectiveness: z.object({
    hasCta: z.boolean().describe('Whether a call-to-action is present'),
    ctaText: z
      .string()
      .optional()
      .describe('The call-to-action text if present'),
    placement: z.enum(['strong-close', 'adequate', 'buried', 'missing']),
    urgency: z.enum(['compelling', 'adequate', 'weak', 'none']),
    suggestions: z
      .array(z.string())
      .describe('Ways to improve the CTA'),
  }),
  emotionalRationalBalance: z.object({
    balance: z.enum(['emotion-led', 'balanced', 'rational-led', 'neither']),
    assessment: z
      .string()
      .describe('How well the emotional and rational elements work together'),
    emotionalMoments: z
      .array(z.string())
      .describe('Key moments that create emotional connection'),
    rationalElements: z
      .array(z.string())
      .describe('Logical or informational elements that support the message'),
  }),
});

export type ShortFormAnalysis = z.infer<typeof shortFormAnalysisSchema>;
