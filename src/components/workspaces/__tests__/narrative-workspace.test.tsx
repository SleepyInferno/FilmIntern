import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NarrativeWorkspace } from '../narrative-workspace';
import type { NarrativeAnalysis } from '@/lib/ai/schemas/narrative';

function createMockNarrativeAnalysis(): NarrativeAnalysis {
  return {
    storyStructure: {
      beats: [
        {
          name: 'inciting-incident',
          description: 'The protagonist discovers the conspiracy',
          approximatePosition: 'p. 12',
          effectiveness: 'strong',
        },
        {
          name: 'midpoint',
          description: 'A major reversal shifts the stakes',
          approximatePosition: 'p. 55',
          effectiveness: 'adequate',
        },
        {
          name: 'climax',
          description: 'Final confrontation with the antagonist',
          approximatePosition: 'p. 90',
          effectiveness: 'strong',
        },
      ],
      pacingAssessment: 'The script moves at a confident pace with strong momentum.',
      tensionArc: 'Tension builds steadily from act one through a gripping climax.',
      structuralStrengths: ['Strong three-act structure', 'Clear turning points'],
      structuralWeaknesses: ['Act two sags slightly in the middle'],
    },
    scriptCoverage: {
      characters: [
        {
          name: 'Alice',
          role: 'protagonist',
          arcAssessment: 'Alice undergoes a compelling transformation.',
          strengths: ['Clear motivation', 'Consistent voice'],
          weaknesses: ['Backstory underexplored'],
        },
        {
          name: 'Victor',
          role: 'antagonist',
          arcAssessment: 'Victor is a credible threat throughout.',
          strengths: ['Menacing presence'],
          weaknesses: ['Motivation revealed too late'],
        },
        {
          name: 'Mira',
          role: 'supporting',
          arcAssessment: 'Mira provides crucial emotional counterweight.',
          strengths: ['Warm chemistry with protagonist'],
          weaknesses: ['Underutilized in act three'],
        },
        {
          name: 'Dean',
          role: 'minor',
          arcAssessment: 'Dean serves the plot efficiently.',
          strengths: ['Memorable introduction'],
          weaknesses: ['Disappears mid-story'],
        },
      ],
      conflictAssessment: {
        primary: 'Alice must expose the conspiracy before it destroys her city.',
        secondary: ['Romantic tension with Dean', 'Family estrangement subplot'],
        effectiveness: 'compelling',
      },
      dialogueQuality: {
        overall: 'sharp',
        strengths: ['Distinctive character voices', 'Subtext-rich exchanges'],
        weaknesses: ['Occasional expository clunks'],
        notableLines: ['"Trust is a luxury I gave up years ago."'],
      },
      marketability: {
        loglineQuality: 'strong',
        suggestedLogline: 'A disgraced investigator must unravel a city-wide conspiracy before it silences her permanently.',
        compTitles: ['Chinatown', 'Zodiac', 'Knives Out'],
        commercialViability: 'high',
      },
      overallStrengths: ['Compelling premise', 'Strong lead character'],
      overallWeaknesses: ['Third act rushes to resolution'],
    },
    themes: {
      centralThemes: ['Corruption', 'Trust', 'Redemption'],
      emotionalResonance: 'The script achieves genuine emotional weight in its quieter moments.',
      audienceImpact: 'Audiences will leave questioning institutional power structures.',
    },
    developmentRecommendations: [
      'Deepen Alices backstory in act one',
      'Clarify Victors motivation earlier',
      'Give the third act more breathing room',
    ],
    overallScore: 7.5,
    overallSummary: 'A confident genre piece with a strong lead and sharp dialogue that stumbles slightly in the final act.',
  };
}

describe('NarrativeWorkspace', () => {
  it('renders 8 evaluation cards with correct titles', () => {
    render(<NarrativeWorkspace data={createMockNarrativeAnalysis()} isStreaming={false} />);

    expect(screen.getByText('Logline & Premise')).toBeInTheDocument();
    expect(screen.getByText('Story Structure')).toBeInTheDocument();
    expect(screen.getByText('Character Arcs')).toBeInTheDocument();
    expect(screen.getByText('Dialogue & Voice')).toBeInTheDocument();
    expect(screen.getByText('Theme & Resonance')).toBeInTheDocument();
    expect(screen.getByText('Pacing & Tension')).toBeInTheDocument();
    expect(screen.getByText('Genre & Comparables')).toBeInTheDocument();
    expect(screen.getByText('Development Recommendations')).toBeInTheDocument();
  });

  it('renders workspace header with Story Lab Workspace title', () => {
    render(<NarrativeWorkspace data={createMockNarrativeAnalysis()} isStreaming={false} />);
    expect(screen.getByText('Story Lab Workspace')).toBeInTheDocument();
  });

  it('shows skeleton cards when data is null and isStreaming is true', () => {
    const { container } = render(<NarrativeWorkspace data={null} isStreaming={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders streaming status bar when streaming', () => {
    render(<NarrativeWorkspace data={null} isStreaming={true} />);
    expect(screen.getByText('Analyzing your material...')).toBeInTheDocument();
  });
});
