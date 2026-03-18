import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CorporateWorkspace } from '../corporate-workspace';
import type { CorporateAnalysis } from '@/lib/ai/schemas/corporate';

function createMockCorporateAnalysis(): CorporateAnalysis {
  return {
    summary: {
      overview: 'A strong set of executive interviews with clear brand messaging.',
      speakerCount: 3,
      primaryContext: 'executive-interview',
      dominantMessages: ['Innovation leadership', 'Customer focus', 'Growth trajectory'],
    },
    soundbites: [
      {
        quote: 'We are redefining what it means to lead in this space.',
        speaker: 'Jane Smith, CEO',
        context: 'Strong vision statement suitable for brand video opening.',
        category: 'vision-statement',
        usability: 'hero-quote',
      },
      {
        quote: 'Our customers are at the heart of every decision we make.',
        speaker: 'Tom Lee, CMO',
        context: 'Customer-centric messaging, good for mid-video placement.',
        category: 'key-message',
        usability: 'strong',
      },
    ],
    messagingThemes: [
      {
        theme: 'Innovation Leadership',
        description: 'Consistent emphasis on being first-to-market and technology-forward.',
        evidence: ['"We are redefining what it means to lead."', '"First to market three years running."'],
        consistency: 'unified',
      },
      {
        theme: 'Customer Focus',
        description: 'Customer-centric language across all speakers.',
        evidence: ['"Our customers are at the heart of every decision."'],
        consistency: 'mostly-consistent',
      },
    ],
    speakerEffectiveness: [
      {
        speaker: 'Jane Smith',
        strengths: ['Natural on camera', 'Concise delivery'],
        areasForImprovement: ['Can rush key messages'],
        quotability: 'highly-quotable',
        onMessageScore: 'on-message',
      },
    ],
    editorialNotes: {
      recommendedNarrative: 'Open with Jane\'s vision statement, build through customer evidence, close with growth data.',
      messagingGaps: ['Missing competitive differentiation', 'No mention of sustainability initiatives'],
      suggestedCuts: 'Trim Tom\'s second answer by 30 seconds — repeats Jane\'s point without adding new information.',
    },
    overallScore: 8,
    overallSummary: 'A polished set of interviews with strong spokesperson performance and consistent brand messaging.',
    spokespersonAssessment: {
      overallReadiness: 'camera-ready',
      summary: 'All three spokespeople present well, with Jane delivering standout material.',
      topPerformer: 'Jane Smith',
    },
    audienceAlignment: {
      targetAudience: 'B2B technology buyers and investors',
      alignmentRating: 'strong',
      assessment: 'Messaging resonates well with a sophisticated B2B audience.',
      suggestions: ['Add more ROI-focused language for investor audience'],
    },
    messageConsistency: {
      consistencyRating: 'unified',
      assessment: 'All speakers reinforce the same core themes without contradiction.',
      keyConflicts: [],
    },
  };
}

describe('CorporateWorkspace', () => {
  it('renders 6 evaluation cards with correct titles', () => {
    render(<CorporateWorkspace data={createMockCorporateAnalysis()} isStreaming={false} />);

    expect(screen.getByText('Soundbites')).toBeInTheDocument();
    expect(screen.getByText('Key Messages')).toBeInTheDocument();
    expect(screen.getByText('Spokesperson Assessment')).toBeInTheDocument();
    expect(screen.getByText('Audience Alignment')).toBeInTheDocument();
    expect(screen.getByText('Message Consistency')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('renders workspace header with "Media Prep Workspace" title', () => {
    render(<CorporateWorkspace data={createMockCorporateAnalysis()} isStreaming={false} />);
    expect(screen.getByText('Media Prep Workspace')).toBeInTheDocument();
  });

  it('shows skeleton cards when data is null and isStreaming is true', () => {
    const { container } = render(<CorporateWorkspace data={null} isStreaming={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles missing optional fields gracefully', () => {
    const dataWithoutOptionals: Partial<CorporateAnalysis> = {
      soundbites: [
        {
          quote: 'Test quote',
          speaker: 'Test Speaker',
          context: 'Test context',
          category: 'key-message',
          usability: 'strong',
        },
      ],
      messagingThemes: [],
      speakerEffectiveness: [],
      editorialNotes: {
        recommendedNarrative: 'Test narrative',
        messagingGaps: [],
        suggestedCuts: 'No cuts needed',
      },
      // spokespersonAssessment, audienceAlignment, messageConsistency intentionally omitted
    };

    render(<CorporateWorkspace data={dataWithoutOptionals} isStreaming={false} />);

    expect(screen.getByText('Spokesperson assessment not available for this analysis')).toBeInTheDocument();
    expect(screen.getByText('Audience alignment data not available for this analysis')).toBeInTheDocument();
    expect(screen.getByText('Message consistency data not available for this analysis')).toBeInTheDocument();
  });
});
