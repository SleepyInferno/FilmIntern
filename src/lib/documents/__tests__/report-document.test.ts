import { describe, it, expect } from 'vitest';
import { buildReportDocument } from '../report-document';
import type { GeneratedDocument } from '../types';
import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';
import type { CorporateAnalysis } from '@/lib/ai/schemas/corporate';
import type { NarrativeAnalysis } from '@/lib/ai/schemas/narrative';
import type { TvEpisodicAnalysis } from '@/lib/ai/schemas/tv-episodic';
import type { ShortFormAnalysis } from '@/lib/ai/schemas/short-form';

// --- Minimal fixtures ---

const documentaryFixture: DocumentaryAnalysis = {
  summary: {
    overview: 'A documentary about wildlife.',
    intervieweeCount: 2,
    dominantThemes: ['nature', 'survival'],
    totalQuotesExtracted: 3,
  },
  keyQuotes: [
    {
      quote: 'The wild is beautiful.',
      speaker: 'Jane',
      context: 'Opening remark',
      category: 'emotional',
      usefulness: 'must-use',
    },
    {
      quote: 'Survival is key.',
      speaker: 'John',
      context: 'Core theme',
      category: 'informational',
      usefulness: 'strong',
    },
  ],
  recurringThemes: [
    {
      theme: 'Nature',
      description: 'The beauty of nature',
      evidence: ['Trees', 'Rivers'],
      frequency: 'dominant',
    },
  ],
  keyMoments: [
    {
      moment: 'The sunrise reveal',
      significance: 'Visual turning point',
      approximateLocation: 'early',
      type: 'emotional-peak',
    },
  ],
  editorialNotes: {
    narrativeThreads: ['Wildlife journey'],
    missingPerspectives: ['Local community'],
    suggestedStructure: 'Chronological arc',
  },
};

const corporateFixture: CorporateAnalysis = {
  summary: {
    overview: 'Corporate brand interview.',
    speakerCount: 1,
    primaryContext: 'brand-marketing',
    dominantMessages: ['Innovation'],
  },
  soundbites: [
    {
      quote: 'We lead with innovation.',
      speaker: 'CEO',
      context: 'Key message',
      category: 'key-message',
      usability: 'hero-quote',
    },
  ],
  messagingThemes: [
    {
      theme: 'Innovation',
      description: 'Driving change',
      evidence: ['R&D investment'],
      consistency: 'unified',
    },
  ],
  speakerEffectiveness: [
    {
      speaker: 'CEO',
      strengths: ['Confident delivery'],
      areasForImprovement: ['Pacing'],
      quotability: 'highly-quotable',
      onMessageScore: 'on-message',
    },
  ],
  editorialNotes: {
    recommendedNarrative: 'Innovation story',
    messagingGaps: ['Sustainability'],
    suggestedCuts: 'Tighten middle section',
  },
};

const narrativeStructureFixture: NarrativeAnalysis = {
  storyAngle: 'A story about the price of obsession when the goal eclipses the person pursuing it.',
  storyStructure: {
    beats: [
      {
        name: 'inciting-incident',
        description: 'Hero discovers the map',
        approximatePosition: 'early',
        effectiveness: 'strong',
      },
    ],
    pacingAssessment: 'Well paced overall',
    tensionArc: 'Builds steadily',
    structuralStrengths: ['Strong opening'],
    structuralWeaknesses: ['Saggy middle'],
  },
  scriptCoverage: {
    characters: [
      {
        name: 'Hero',
        role: 'protagonist',
        arcAssessment: 'Compelling arc',
        strengths: ['Relatable'],
        weaknesses: ['Underdeveloped backstory'],
      },
    ],
    conflictAssessment: {
      primary: 'Man vs nature',
      secondary: ['Internal doubt'],
      effectiveness: 'compelling',
    },
    dialogueQuality: {
      overall: 'sharp',
      strengths: ['Authentic voice'],
      weaknesses: ['Exposition dumps'],
      notableLines: ['I will find a way.'],
    },
    marketability: {
      loglineQuality: 'strong',
      suggestedLogline: 'A hero discovers a map that changes everything.',
      compTitles: ['Indiana Jones', 'The Goonies'],
      commercialViability: 'high',
    },
    overallStrengths: ['Great dialogue'],
    overallWeaknesses: ['Pacing in Act 2'],
  },
  themes: {
    centralThemes: ['Survival', 'Identity'],
    emotionalResonance: 'Lands its emotional beats well',
    audienceImpact: 'Leaves viewers reflecting on resilience',
  },
  developmentRecommendations: ['Tighten the Act 2 midpoint', 'Clarify antagonist motivation'],
};

const tvEpisodicFixture: TvEpisodicAnalysis = {
  episodeAnalysis: {
    coldOpen: {
      description: 'A mysterious stranger arrives',
      hookStrength: 'strong',
      notes: 'Immediately engaging',
    },
    storyStrands: [
      {
        strand: 'a-story',
        description: 'Main mystery',
        characters: ['Detective'],
        effectiveness: 'compelling',
      },
    ],
    characterIntroductions: [
      {
        character: 'Detective',
        introMethod: 'Action scene',
        effectiveness: 'memorable',
      },
    ],
    episodeArc: {
      setup: 'Case arrives',
      escalation: 'Twists compound',
      resolution: 'Partial resolution',
      cliffhanger: 'New suspect revealed',
      pacing: 'tight',
    },
  },
  seriesAnalysis: {
    premiseLongevity: {
      assessment: 'multi-season',
      reasoning: 'Rich world to explore',
    },
    serializedHooks: [
      {
        hook: 'Who is the stranger?',
        type: 'mystery',
        sustainability: 'strong',
      },
    ],
    episodicVsSerial: {
      balance: 'balanced',
      assessment: 'Good mix of standalone and serial',
    },
    seasonArcPotential: {
      suggestedArc: 'Uncover the conspiracy',
      strengths: ['Multiple layers'],
      concerns: ['Complexity management'],
    },
  },
};

const shortFormFixture: ShortFormAnalysis = {
  summary: {
    overview: 'A 30-second brand hero spot.',
    detectedFormat: 'brand-hero',
    estimatedDuration: '30 seconds',
    primaryObjective: 'Brand awareness',
  },
  hookStrength: {
    opening: 'Strong visual hook',
    hookRating: 'scroll-stopping',
    timeToHook: '2 seconds',
    suggestions: ['Add sound design'],
  },
  pacing: {
    overall: 'tight',
    assessment: 'Fast-paced and engaging',
    deadSpots: [],
    recommendations: ['Maintain energy'],
  },
  messagingClarity: {
    primaryMessage: 'Brand X leads innovation',
    clarity: 'crystal-clear',
    messageRetention: 'High recall expected',
    improvements: [],
  },
  ctaEffectiveness: {
    hasCta: true,
    ctaText: 'Visit brandx.com',
    placement: 'strong-close',
    urgency: 'compelling',
    suggestions: [],
  },
  emotionalRationalBalance: {
    balance: 'emotion-led',
    assessment: 'Emotion drives the piece well',
    emotionalMoments: ['Opening montage'],
    rationalElements: ['Brand stats overlay'],
  },
};

// --- Tests ---

describe('buildReportDocument', () => {
  const baseInput = {
    title: 'Test Report',
    writtenBy: 'Tester',
    sourceText: 'Some uploaded text content.',
  };

  describe('returns a valid GeneratedDocument for every report kind', () => {
    const cases: Array<{
      reportKind: string;
      projectType: string;
      analysis: unknown;
    }> = [
      {
        reportKind: 'documentary',
        projectType: 'documentary',
        analysis: documentaryFixture,
      },
      {
        reportKind: 'corporate',
        projectType: 'corporate',
        analysis: corporateFixture,
      },
      {
        reportKind: 'narrative-structure',
        projectType: 'narrative',
        analysis: narrativeStructureFixture,
      },
      {
        reportKind: 'narrative-coverage',
        projectType: 'narrative',
        analysis: narrativeStructureFixture,
      },
      {
        reportKind: 'tv-episodic',
        projectType: 'tv-episodic',
        analysis: tvEpisodicFixture,
      },
      {
        reportKind: 'short-form',
        projectType: 'short-form',
        analysis: shortFormFixture,
      },
    ];

    it.each(cases)(
      'produces a report document for $reportKind',
      ({ reportKind, projectType, analysis }) => {
        const doc = buildReportDocument({
          reportKind: reportKind as Parameters<
            typeof buildReportDocument
          >[0]['reportKind'],
          projectType,
          analysis,
          ...baseInput,
        });

        expect(doc.kind).toBe('report');
        expect(doc.projectType).toBe(projectType);
        expect(doc.title).toBe('Test Report');
        expect(doc.writtenBy).toBe('Tester');
        expect(doc.cover).toBeDefined();
        expect(doc.cover.title).toBe('Test Report');
        expect(doc.cover.writtenBy).toBe('Tester');
        expect(doc.createdAt).toBeTruthy();
        expect(doc.updatedAt).toBeTruthy();
        expect(doc.content).toBeDefined();
        expect(doc.outlineMode).toBeUndefined();
      }
    );
  });

  describe('normalizers are registered per report kind, not documentary-only', () => {
    it('documentary normalizer produces sections', () => {
      const doc = buildReportDocument({
        reportKind: 'documentary',
        projectType: 'documentary',
        analysis: documentaryFixture,
        ...baseInput,
      });
      // content should have a type key (Tiptap doc structure)
      expect(doc.content).toHaveProperty('type', 'doc');
    });

    it('corporate normalizer produces sections', () => {
      const doc = buildReportDocument({
        reportKind: 'corporate',
        projectType: 'corporate',
        analysis: corporateFixture,
        ...baseInput,
      });
      expect(doc.content).toHaveProperty('type', 'doc');
    });

    it('narrative-structure normalizer produces sections', () => {
      const doc = buildReportDocument({
        reportKind: 'narrative-structure',
        projectType: 'narrative',
        analysis: narrativeStructureFixture,
        ...baseInput,
      });
      expect(doc.content).toHaveProperty('type', 'doc');
    });

    it('narrative-coverage normalizer produces sections', () => {
      const doc = buildReportDocument({
        reportKind: 'narrative-coverage',
        projectType: 'narrative',
        analysis: narrativeStructureFixture,
        ...baseInput,
      });
      expect(doc.content).toHaveProperty('type', 'doc');
    });

    it('tv-episodic normalizer produces sections', () => {
      const doc = buildReportDocument({
        reportKind: 'tv-episodic',
        projectType: 'tv-episodic',
        analysis: tvEpisodicFixture,
        ...baseInput,
      });
      expect(doc.content).toHaveProperty('type', 'doc');
    });

    it('short-form normalizer produces sections', () => {
      const doc = buildReportDocument({
        reportKind: 'short-form',
        projectType: 'short-form',
        analysis: shortFormFixture,
        ...baseInput,
      });
      expect(doc.content).toHaveProperty('type', 'doc');
    });
  });

  describe('quote extraction', () => {
    it('extracts quoteRefs with stable Q labels from documentary keyQuotes', () => {
      const doc = buildReportDocument({
        reportKind: 'documentary',
        projectType: 'documentary',
        analysis: documentaryFixture,
        ...baseInput,
      });
      expect(doc.quoteRefs.length).toBeGreaterThanOrEqual(2);
      expect(doc.quoteRefs[0].label).toBe('Q1');
      expect(doc.quoteRefs[1].label).toBe('Q2');
      expect(doc.quoteRefs[0].text).toBe('The wild is beautiful.');
      expect(doc.quoteRefs[0].speaker).toBe('Jane');
      expect(doc.quoteRefs[1].text).toBe('Survival is key.');
      expect(doc.quoteRefs[1].speaker).toBe('John');
    });

    it('extracts quoteRefs from corporate soundbites', () => {
      const doc = buildReportDocument({
        reportKind: 'corporate',
        projectType: 'corporate',
        analysis: corporateFixture,
        ...baseInput,
      });
      expect(doc.quoteRefs.length).toBeGreaterThanOrEqual(1);
      expect(doc.quoteRefs[0].label).toBe('Q1');
      expect(doc.quoteRefs[0].text).toBe('We lead with innovation.');
      expect(doc.quoteRefs[0].speaker).toBe('CEO');
    });

    it('returns empty quoteRefs for schemas without explicit quotes', () => {
      const doc = buildReportDocument({
        reportKind: 'short-form',
        projectType: 'short-form',
        analysis: shortFormFixture,
        ...baseInput,
      });
      expect(doc.quoteRefs).toEqual([]);
    });
  });

  describe('analysis snapshot and source text preservation', () => {
    it('stores analysisSnapshot for documentary', () => {
      const doc = buildReportDocument({
        reportKind: 'documentary',
        projectType: 'documentary',
        analysis: documentaryFixture,
        ...baseInput,
      });
      expect(doc.analysisSnapshot).toEqual(
        documentaryFixture as unknown as Record<string, unknown>
      );
      expect(doc.sourceText).toBe('Some uploaded text content.');
    });

    it('stores analysisSnapshot for corporate', () => {
      const doc = buildReportDocument({
        reportKind: 'corporate',
        projectType: 'corporate',
        analysis: corporateFixture,
        ...baseInput,
      });
      expect(doc.analysisSnapshot).toEqual(
        corporateFixture as unknown as Record<string, unknown>
      );
      expect(doc.sourceText).toBe('Some uploaded text content.');
    });

    it('stores analysisSnapshot for tv-episodic', () => {
      const doc = buildReportDocument({
        reportKind: 'tv-episodic',
        projectType: 'tv-episodic',
        analysis: tvEpisodicFixture,
        ...baseInput,
      });
      expect(doc.analysisSnapshot).toEqual(
        tvEpisodicFixture as unknown as Record<string, unknown>
      );
    });

    it('stores analysisSnapshot for short-form', () => {
      const doc = buildReportDocument({
        reportKind: 'short-form',
        projectType: 'short-form',
        analysis: shortFormFixture,
        ...baseInput,
      });
      expect(doc.analysisSnapshot).toEqual(
        shortFormFixture as unknown as Record<string, unknown>
      );
    });
  });
});
