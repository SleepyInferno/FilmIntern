import { describe, it, expect } from 'vitest';
import { shortFormAnalysisSchema } from '../short-form';

const validAnalysis = {
  summary: {
    overview: 'A 60-second brand hero film for a fitness app launch, built around a transformation narrative.',
    detectedFormat: 'brand-hero' as const,
    estimatedDuration: ':60',
    primaryObjective: 'Drive app downloads by showcasing a relatable fitness transformation story.',
  },
  hookStrength: {
    opening: 'Opens with a close-up of an alarm clock at 5:00 AM — the universal "I don\'t want to get up" moment.',
    hookRating: 'scroll-stopping' as const,
    timeToHook: 'Under 2 seconds — the alarm visual is immediately relatable.',
    suggestions: ['Consider adding a text overlay with a provocative stat to reinforce the hook'],
  },
  pacing: {
    overall: 'tight' as const,
    assessment: 'The piece maintains momentum through quick cuts that mirror the intensity of a workout progression.',
    deadSpots: ['Brief plateau around :25-:30 during the transition from gym to outdoor shots'],
    recommendations: ['Tighten the gym-to-outdoor transition', 'Add a musical hit at :25 to bridge the energy gap'],
  },
  messagingClarity: {
    primaryMessage: 'This app makes fitness transformation achievable for everyday people.',
    clarity: 'crystal-clear' as const,
    messageRetention: 'High — the transformation arc and final super reinforce the core promise.',
    improvements: ['Consider stating the key differentiator earlier in the piece'],
  },
  ctaEffectiveness: {
    hasCta: true,
    ctaText: 'Download free. Start today.',
    placement: 'strong-close' as const,
    urgency: 'compelling' as const,
    suggestions: ['Add a QR code for mobile-first audiences viewing on desktop or OOH placements'],
  },
  emotionalRationalBalance: {
    balance: 'emotion-led' as const,
    assessment: 'The piece leads with aspiration and empathy, then lands rational proof at the end. Well-calibrated for brand awareness.',
    emotionalMoments: ['5 AM alarm relatability', 'First visible progress moment', 'Final confident smile'],
    rationalElements: ['App UI screenshot at :45', 'Free download mention in CTA'],
  },
};

describe('shortFormAnalysisSchema', () => {
  it('validates a well-formed analysis object', () => {
    const result = shortFormAnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it('rejects object missing hookStrength', () => {
    const { hookStrength, ...incomplete } = validAnalysis;
    const result = shortFormAnalysisSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects object with invalid hook rating', () => {
    const invalid = {
      ...validAnalysis,
      hookStrength: {
        ...validAnalysis.hookStrength,
        hookRating: 'amazing',
      },
    };
    const result = shortFormAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects object missing ctaEffectiveness', () => {
    const { ctaEffectiveness, ...incomplete } = validAnalysis;
    const result = shortFormAnalysisSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });
});
