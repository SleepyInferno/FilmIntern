import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DocumentaryWorkspace } from '../documentary-workspace';
import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';

function createMockDocumentaryAnalysis(): DocumentaryAnalysis {
  return {
    summary: {
      overview: 'A compelling documentary about climate activists.',
      intervieweeCount: 4,
      dominantThemes: ['Climate Change', 'Activism', 'Hope'],
      totalQuotesExtracted: 12,
    },
    keyQuotes: [
      {
        quote: 'We are running out of time to act.',
        speaker: 'Dr. Elena Torres',
        context: 'Captures the urgency felt by the scientific community.',
        category: 'emotional',
        usefulness: 'must-use',
      },
      {
        quote: 'Every protest is a vote for the future.',
        speaker: 'Marcus Webb',
        context: 'Defines the activist philosophy driving the movement.',
        category: 'revealing',
        usefulness: 'strong',
      },
    ],
    recurringThemes: [
      {
        theme: 'Urgency of Action',
        description: 'The recurring sense that immediate action is critical.',
        evidence: ['"No more delays"', '"Time is the enemy"'],
        frequency: 'dominant',
      },
    ],
    keyMoments: [
      {
        moment: 'Elena breaks down describing the coral bleaching event',
        significance: 'Turns an abstract statistic into a human story.',
        approximateLocation: 'middle',
        type: 'emotional-peak',
      },
      {
        moment: 'Politician contradicts his earlier public statements',
        significance: 'Exposes the gap between rhetoric and reality.',
        approximateLocation: 'late',
        type: 'contradiction',
      },
    ],
    editorialNotes: {
      narrativeThreads: ['Follow Elena from despair to renewed hope', 'The youth vs establishment tension'],
      missingPerspectives: ['Industry representatives', 'Affected coastal communities'],
      suggestedStructure: 'Character-driven arc from crisis awareness to community action.',
    },
    overallScore: 8.2,
    overallSummary: 'Powerful material with strong emotional anchors and clear narrative potential.',
    subjectProfiles: [
      {
        name: 'Dr. Elena Torres',
        role: 'Marine biologist and activist',
        keyContribution: 'Scientific credibility combined with deep personal investment.',
        quotability: 'highly-quotable',
      },
      {
        name: 'Marcus Webb',
        role: 'Grassroots organizer',
        keyContribution: 'Authentic voice of frontline activism.',
        quotability: 'adequate',
      },
    ],
    storyArc: {
      assessment: 'The material supports a compelling three-act documentary structure.',
      suggestedStructure: 'Chronological with character-driven B-storylines.',
      strengths: ['Strong emotional climax material', 'Clear protagonist journey'],
      gaps: ['Missing resolution footage', 'Thin act-two connective tissue'],
    },
  };
}

describe('DocumentaryWorkspace', () => {
  it('renders 6 evaluation cards', () => {
    render(<DocumentaryWorkspace data={createMockDocumentaryAnalysis()} isStreaming={false} />);

    expect(screen.getByText('Key Quotes')).toBeInTheDocument();
    expect(screen.getByText('Recurring Themes')).toBeInTheDocument();
    expect(screen.getByText('Key Moments')).toBeInTheDocument();
    expect(screen.getByText('Subject Profiles')).toBeInTheDocument();
    expect(screen.getByText('Story Arc')).toBeInTheDocument();
    expect(screen.getByText('Interview Gaps')).toBeInTheDocument();
  });

  it('renders workspace header with Documentary Workspace title', () => {
    render(<DocumentaryWorkspace data={createMockDocumentaryAnalysis()} isStreaming={false} />);
    expect(screen.getByText('Documentary Workspace')).toBeInTheDocument();
  });

  it('shows skeleton cards when streaming with null data', () => {
    const { container } = render(<DocumentaryWorkspace data={null} isStreaming={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles missing optional fields gracefully', () => {
    const dataWithoutOptionals: Partial<DocumentaryAnalysis> = {
      summary: {
        overview: 'A minimal analysis.',
        intervieweeCount: 1,
        dominantThemes: ['Change'],
        totalQuotesExtracted: 3,
      },
      keyQuotes: [
        {
          quote: 'Things must change.',
          speaker: 'Unknown',
          context: 'Opening statement.',
          category: 'informational',
          usefulness: 'supporting',
        },
      ],
      recurringThemes: [],
      keyMoments: [],
      editorialNotes: {
        narrativeThreads: [],
        missingPerspectives: ['Local voices'],
        suggestedStructure: 'Linear chronological structure.',
      },
      // subjectProfiles and storyArc intentionally omitted
    };

    render(<DocumentaryWorkspace data={dataWithoutOptionals} isStreaming={false} />);

    expect(screen.getByText('Subject profile data not available for this analysis')).toBeInTheDocument();
    expect(screen.getByText('Story arc data not available for this analysis')).toBeInTheDocument();
  });
});
