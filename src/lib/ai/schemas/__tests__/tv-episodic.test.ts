import { describe, it, expect } from 'vitest';
import { tvEpisodicAnalysisSchema } from '../tv-episodic';

const validAnalysis = {
  episodeAnalysis: {
    coldOpen: {
      description: 'A body is discovered in a locked office building after hours. Security footage shows no one entering or leaving.',
      hookStrength: 'strong' as const,
      notes: 'Classic locked-room hook that immediately establishes the procedural engine and raises a compelling question.',
    },
    storyStrands: [
      {
        strand: 'a-story' as const,
        description: 'The locked-room murder investigation drives the episode, with each clue reframing what happened.',
        characters: ['Detective Reyes', 'Dr. Okafor'],
        effectiveness: 'compelling' as const,
      },
      {
        strand: 'b-story' as const,
        description: 'Reyes navigates tension with a new partner who questions her unorthodox methods.',
        characters: ['Detective Reyes', 'Detective Park'],
        effectiveness: 'serviceable' as const,
      },
    ],
    characterIntroductions: [
      {
        character: 'Detective Reyes',
        introMethod: 'Introduced mid-argument with a suspect, immediately establishing her aggressive interrogation style.',
        effectiveness: 'memorable' as const,
      },
    ],
    episodeArc: {
      setup: 'The locked-room mystery is established with three potential suspects, each with motive.',
      escalation: 'Evidence eliminates suspects one by one while revealing a deeper corporate conspiracy.',
      resolution: 'The murder is solved but the conspiracy thread is left open for the season.',
      cliffhanger: 'Reyes discovers the victim was investigating her own department.',
      pacing: 'tight' as const,
    },
  },
  seriesAnalysis: {
    premiseLongevity: {
      assessment: 'multi-season' as const,
      reasoning: 'The procedural engine generates infinite episodic stories while the departmental conspiracy provides a rich serial thread.',
    },
    serializedHooks: [
      {
        hook: 'What was the victim investigating inside the department?',
        type: 'mystery' as const,
        sustainability: 'strong' as const,
      },
      {
        hook: 'Reyes and Park\'s evolving partnership and trust dynamic.',
        type: 'relationship' as const,
        sustainability: 'strong' as const,
      },
    ],
    episodicVsSerial: {
      balance: 'balanced' as const,
      assessment: 'Each episode delivers a satisfying case-of-the-week resolution while advancing the conspiracy arc by one meaningful beat. Well-calibrated for streaming.',
    },
    seasonArcPotential: {
      suggestedArc: 'Season 1 builds toward Reyes uncovering systemic corruption within her own department, forcing her to choose between loyalty and justice.',
      strengths: ['Clear central question', 'Escalatable stakes', 'Strong character dilemma'],
      concerns: ['Conspiracy reveal needs careful pacing to avoid feeling repetitive', 'Partner dynamic risks cliche if not developed beyond trust issues'],
    },
  },
};

describe('tvEpisodicAnalysisSchema', () => {
  it('validates a well-formed analysis object', () => {
    const result = tvEpisodicAnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it('rejects object missing episodeAnalysis', () => {
    const { episodeAnalysis, ...incomplete } = validAnalysis;
    const result = tvEpisodicAnalysisSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects object missing seriesAnalysis', () => {
    const { seriesAnalysis, ...incomplete } = validAnalysis;
    const result = tvEpisodicAnalysisSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects object with invalid story strand enum', () => {
    const invalid = {
      ...validAnalysis,
      episodeAnalysis: {
        ...validAnalysis.episodeAnalysis,
        storyStrands: [
          {
            ...validAnalysis.episodeAnalysis.storyStrands[0],
            strand: 'd-story',
          },
        ],
      },
    };
    const result = tvEpisodicAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects object with invalid premise longevity assessment', () => {
    const invalid = {
      ...validAnalysis,
      seriesAnalysis: {
        ...validAnalysis.seriesAnalysis,
        premiseLongevity: {
          ...validAnalysis.seriesAnalysis.premiseLongevity,
          assessment: 'infinite',
        },
      },
    };
    const result = tvEpisodicAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
