import { describe, it, expect } from 'vitest';
import { documentaryAnalysisSchema } from '../documentary';

const validAnalysis = {
  summary: {
    overview: 'A compelling interview about urban development.',
    intervieweeCount: 2,
    dominantThemes: ['urban renewal', 'community displacement', 'hope'],
    totalQuotesExtracted: 10,
  },
  keyQuotes: [
    {
      quote: 'This neighborhood used to be alive.',
      speaker: 'Maria Lopez',
      context: 'Reflects on the loss of community spaces.',
      category: 'emotional' as const,
      usefulness: 'must-use' as const,
    },
  ],
  recurringThemes: [
    {
      theme: 'Community Displacement',
      description: 'Residents describe being pushed out by rising costs.',
      evidence: ['We had to leave', 'Nobody could afford it anymore'],
      frequency: 'dominant' as const,
    },
  ],
  keyMoments: [
    {
      moment: 'Maria breaks down describing her old home',
      significance: 'Raw emotional peak that anchors the documentary narrative.',
      approximateLocation: 'middle',
      type: 'emotional-peak' as const,
    },
  ],
  editorialNotes: {
    narrativeThreads: ['Follow the displacement timeline', 'Contrast old and new residents'],
    missingPerspectives: ['Developer viewpoint not represented'],
    suggestedStructure: 'Open with the neighborhood today, flashback through interviews, close with current residents.',
  },
};

describe('documentaryAnalysisSchema', () => {
  it('validates a well-formed analysis object', () => {
    const result = documentaryAnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it('rejects object missing keyQuotes', () => {
    const { keyQuotes, ...incomplete } = validAnalysis;
    const result = documentaryAnalysisSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects object with invalid quote category', () => {
    const invalid = {
      ...validAnalysis,
      keyQuotes: [
        {
          ...validAnalysis.keyQuotes[0],
          category: 'invalid-category',
        },
      ],
    };
    const result = documentaryAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
