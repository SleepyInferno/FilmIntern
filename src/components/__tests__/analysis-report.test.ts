import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisReport } from '../analysis-report';
import type { DocumentaryAnalysis } from '@/lib/ai/schemas/documentary';

const mockData: DocumentaryAnalysis = {
  summary: {
    overview: 'A compelling look at urban farming initiatives across three cities.',
    intervieweeCount: 4,
    dominantThemes: ['sustainability', 'community', 'food access'],
    totalQuotesExtracted: 12,
  },
  keyQuotes: [
    {
      quote: 'We started with just one raised bed and a dream.',
      speaker: 'Maria Gonzalez',
      context: 'Opening anecdote about the founding of the community garden.',
      category: 'emotional',
      usefulness: 'must-use',
    },
    {
      quote: 'The data shows a 40% reduction in food deserts.',
      speaker: 'Dr. James Chen',
      context: 'Key statistic supporting the documentary thesis.',
      category: 'informational',
      usefulness: 'strong',
    },
  ],
  recurringThemes: [
    {
      theme: 'Community Resilience',
      description: 'How neighborhoods organize to address food insecurity.',
      evidence: [
        'We built this together, one plot at a time.',
        'Every Saturday, 30 volunteers show up without being asked.',
      ],
      frequency: 'dominant',
    },
  ],
  keyMoments: [
    {
      moment: 'Maria breaks down describing the first harvest',
      significance: 'Raw emotional peak that anchors the personal narrative.',
      approximateLocation: 'middle',
      type: 'emotional-peak',
    },
  ],
  editorialNotes: {
    narrativeThreads: [
      'Personal journey of Maria from immigrant to community leader',
      'Policy battles at city council over zoning for urban farms',
    ],
    missingPerspectives: [
      'Landlord and property developer viewpoints',
      'Long-term residents who oppose the garden expansion',
    ],
    suggestedStructure:
      'Three-act structure following the seasons: planting (hope), drought (crisis), harvest (resolution).',
  },
};

describe('AnalysisReport', () => {
  it('renders all 5 section headings when given complete data', () => {
    render(AnalysisReport({ data: mockData, isStreaming: false }));

    expect(screen.getByText('Summary')).toBeDefined();
    expect(screen.getByText('Key Quotes')).toBeDefined();
    expect(screen.getByText('Recurring Themes')).toBeDefined();
    expect(screen.getByText('Key Moments')).toBeDefined();
    expect(screen.getByText('Editorial Notes')).toBeDefined();
  });

  it('renders skeleton loading states when data is null and isStreaming is true', () => {
    render(AnalysisReport({ data: null, isStreaming: true }));

    expect(screen.getByText('Analyzing your transcript...')).toBeDefined();
    // Section headings should still appear during streaming
    expect(screen.getByText('Summary')).toBeDefined();
  });

  it('renders "Analyzing your transcript..." text when isStreaming is true', () => {
    render(AnalysisReport({ data: null, isStreaming: true }));

    expect(screen.getByText('Analyzing your transcript...')).toBeDefined();
  });

  it('renders a specific quote text from mock data', () => {
    render(AnalysisReport({ data: mockData, isStreaming: false }));

    expect(
      screen.getByText(
        /We started with just one raised bed and a dream/
      )
    ).toBeDefined();
  });

  it('renders a theme name from mock data', () => {
    render(AnalysisReport({ data: mockData, isStreaming: false }));

    expect(screen.getByText(/Community Resilience/)).toBeDefined();
  });
});
