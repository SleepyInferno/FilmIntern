import { describe, it, expect } from 'vitest';
import { corporateAnalysisSchema } from '../corporate';

const validAnalysis = {
  summary: {
    overview: 'A CEO interview covering the company rebrand and Q3 growth targets.',
    speakerCount: 3,
    primaryContext: 'brand-marketing' as const,
    dominantMessages: ['innovation leadership', 'customer-first culture', 'sustainable growth'],
  },
  soundbites: [
    {
      quote: 'We are not just changing our logo — we are changing how we show up for our customers.',
      speaker: 'Sarah Chen',
      context: 'Encapsulates the rebrand rationale in one quotable line.',
      category: 'key-message' as const,
      usability: 'hero-quote' as const,
    },
  ],
  messagingThemes: [
    {
      theme: 'Customer-First Transformation',
      description: 'Multiple speakers emphasize a shift from product-centric to customer-centric strategy.',
      evidence: ['We start with the customer now', 'Everything flows from what they need'],
      consistency: 'unified' as const,
    },
  ],
  speakerEffectiveness: [
    {
      speaker: 'Sarah Chen',
      strengths: ['Concise, memorable phrasing', 'Natural on-camera presence'],
      areasForImprovement: ['Tends to repeat the same anecdote'],
      quotability: 'highly-quotable' as const,
      onMessageScore: 'on-message' as const,
    },
  ],
  editorialNotes: {
    recommendedNarrative: 'Lead with the customer transformation story, support with growth data, close with vision.',
    messagingGaps: ['No mention of competitive landscape', 'Sustainability commitments absent'],
    suggestedCuts: 'Trim the middle section where speakers repeat the same growth stats; prioritize the rebrand reveal moment.',
  },
};

describe('corporateAnalysisSchema', () => {
  it('validates a well-formed analysis object', () => {
    const result = corporateAnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it('rejects object missing soundbites', () => {
    const { soundbites, ...incomplete } = validAnalysis;
    const result = corporateAnalysisSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects object with invalid soundbite category', () => {
    const invalid = {
      ...validAnalysis,
      soundbites: [
        {
          ...validAnalysis.soundbites[0],
          category: 'invalid-category',
        },
      ],
    };
    const result = corporateAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
