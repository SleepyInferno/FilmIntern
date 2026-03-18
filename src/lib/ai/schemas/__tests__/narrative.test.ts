import { describe, it, expect } from 'vitest';
import { narrativeAnalysisSchema } from '../narrative';

const validAnalysis = {
  storyStructure: {
    beats: [
      {
        name: 'inciting-incident' as const,
        description: 'A mysterious letter arrives, upending the protagonist\'s quiet life.',
        approximatePosition: 'page 12',
        effectiveness: 'strong' as const,
      },
      {
        name: 'midpoint' as const,
        description: 'The protagonist discovers the letter was sent by their presumed-dead sibling.',
        approximatePosition: 'page 55',
        effectiveness: 'strong' as const,
      },
      {
        name: 'climax' as const,
        description: 'A confrontation in the family home forces both siblings to face the truth.',
        approximatePosition: 'page 95',
        effectiveness: 'adequate' as const,
      },
    ],
    pacingAssessment: 'The first act moves briskly but the second act sags between pages 60-75 with repetitive dialogue scenes.',
    tensionArc: 'Tension builds effectively through the mystery but dissipates during the extended middle section before recovering at the climax.',
    structuralStrengths: ['Strong inciting incident', 'Well-planted revelations'],
    structuralWeaknesses: ['Saggy second act', 'Resolution feels rushed'],
  },
  scriptCoverage: {
    characters: [
      {
        name: 'Elena',
        role: 'protagonist' as const,
        arcAssessment: 'Elena transforms from passive observer to active agent, though the shift happens too abruptly in Act 3.',
        strengths: ['Distinct voice', 'Compelling internal conflict'],
        weaknesses: ['Passive through much of Act 2'],
      },
    ],
    conflictAssessment: {
      primary: 'Elena must decide whether to expose her family\'s secret or protect them.',
      secondary: ['Romantic subplot with the investigator', 'Elena\'s career vs family loyalty'],
      effectiveness: 'compelling' as const,
    },
    dialogueQuality: {
      overall: 'sharp' as const,
      strengths: ['Distinct character voices', 'Effective use of subtext in family scenes'],
      weaknesses: ['Investigator\'s dialogue is expository in Act 1'],
      notableLines: ['You don\'t get to choose which truths are convenient.'],
    },
    marketability: {
      loglineQuality: 'strong' as const,
      suggestedLogline: 'A reclusive teacher\'s life unravels when a letter from her dead sibling reveals a family conspiracy that forces her to choose between justice and loyalty.',
      compTitles: ['Knives Out', 'August: Osage County', 'The Secrets We Keep'],
      commercialViability: 'moderate' as const,
    },
    overallStrengths: ['Compelling central mystery', 'Strong dialogue craft', 'Well-drawn protagonist'],
    overallWeaknesses: ['Second act pacing', 'Rushed resolution', 'Underdeveloped antagonist'],
  },
  themes: {
    centralThemes: ['Family loyalty vs. justice', 'Truth and its consequences'],
    emotionalResonance: 'The script effectively evokes tension and emotional conflict through the central mystery.',
    audienceImpact: 'Viewers will leave questioning the nature of loyalty and what it means to protect family.',
  },
  developmentRecommendations: [
    'Establish protagonist\'s motivation in the opening scene to anchor the audience earlier',
    'Tighten the second act by cutting the repetitive dialogue scenes between pages 60-75',
    'Develop the antagonist with a scene showing their perspective',
  ],
};

describe('narrativeAnalysisSchema', () => {
  it('validates a well-formed analysis object', () => {
    const result = narrativeAnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it('rejects object missing storyStructure', () => {
    const { storyStructure, ...incomplete } = validAnalysis;
    const result = narrativeAnalysisSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects object missing scriptCoverage', () => {
    const { scriptCoverage, ...incomplete } = validAnalysis;
    const result = narrativeAnalysisSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects object with invalid beat name', () => {
    const invalid = {
      ...validAnalysis,
      storyStructure: {
        ...validAnalysis.storyStructure,
        beats: [
          {
            ...validAnalysis.storyStructure.beats[0],
            name: 'invalid-beat',
          },
        ],
      },
    };
    const result = narrativeAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects object with invalid character role', () => {
    const invalid = {
      ...validAnalysis,
      scriptCoverage: {
        ...validAnalysis.scriptCoverage,
        characters: [
          {
            ...validAnalysis.scriptCoverage.characters[0],
            role: 'villain',
          },
        ],
      },
    };
    const result = narrativeAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
