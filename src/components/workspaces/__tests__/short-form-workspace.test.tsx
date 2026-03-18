import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ShortFormWorkspace } from '../short-form-workspace';
import type { ShortFormAnalysis } from '@/lib/ai/schemas/short-form';

function createMockShortFormAnalysis(): ShortFormAnalysis {
  return {
    summary: {
      overview: 'A punchy brand hero film with a strong emotional hook and clear CTA.',
      detectedFormat: 'brand-hero',
      estimatedDuration: '60-90 seconds',
      primaryObjective: 'Drive brand awareness and emotional connection with target audience.',
    },
    hookStrength: {
      opening: 'Opens with a visually striking image of a child discovering the product for the first time.',
      hookRating: 'scroll-stopping',
      timeToHook: 'Under 3 seconds',
      suggestions: ['Consider adding a sound design element for social media autoplay', 'Test alternate text overlay for Instagram'],
    },
    pacing: {
      overall: 'tight',
      assessment: 'The 60-second cut maintains excellent momentum throughout with no wasted frames.',
      deadSpots: [],
      recommendations: ['The brand reveal at 0:45 could hit 5 seconds earlier for stronger recall'],
    },
    messagingClarity: {
      primaryMessage: 'Discovery is in your hands.',
      clarity: 'crystal-clear',
      messageRetention: 'High retention expected — simple, memorable tagline supported by visual reinforcement.',
      improvements: ['Add product name mention in voiceover for unaided recall'],
    },
    ctaEffectiveness: {
      hasCta: true,
      ctaText: 'Shop now at brand.com',
      placement: 'strong-close',
      urgency: 'adequate',
      suggestions: ['Add limited-time incentive to drive immediate action'],
    },
    overallScore: 8.5,
    overallSummary: 'A polished branded film with exceptional visual storytelling and a memorable central message.',
    audienceFit: {
      primaryAudience: 'Parents of children ages 4-10, household income $75k+',
      fitRating: 'strong',
      assessment: 'The content speaks directly to the emotional needs and aspirations of the target parent demographic.',
      suggestions: ['Test a slightly longer version (90s) for YouTube pre-roll targeting'],
    },
    emotionalRationalBalance: {
      balance: 'emotion-led',
      assessment: 'Strong emotional storytelling with subtle rational product proof points woven in.',
      emotionalMoments: ['Child discovery moment at 0:08', 'Parent smile reaction at 0:32', 'Family togetherness montage at 0:48'],
      rationalElements: ['Product feature demonstration at 0:20', 'Social proof overlay at 0:55'],
    },
  };
}

describe('ShortFormWorkspace', () => {
  it('renders 6 evaluation cards with correct titles', () => {
    render(<ShortFormWorkspace data={createMockShortFormAnalysis()} isStreaming={false} />);

    expect(screen.getByText('Hook Strength')).toBeInTheDocument();
    expect(screen.getByText('Pacing')).toBeInTheDocument();
    expect(screen.getByText('CTA Clarity')).toBeInTheDocument();
    expect(screen.getByText('Brand Alignment')).toBeInTheDocument();
    expect(screen.getByText('Emotional Impact')).toBeInTheDocument();
    expect(screen.getByText('Audience Fit')).toBeInTheDocument();
  });

  it('renders workspace header with "Impact Lab Workspace" title', () => {
    render(<ShortFormWorkspace data={createMockShortFormAnalysis()} isStreaming={false} />);
    expect(screen.getByText('Impact Lab Workspace')).toBeInTheDocument();
  });

  it('shows skeleton cards when data is null and isStreaming is true', () => {
    const { container } = render(<ShortFormWorkspace data={null} isStreaming={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles missing audienceFit gracefully', () => {
    const dataWithoutAudienceFit: Partial<ShortFormAnalysis> = {
      hookStrength: {
        opening: 'Strong visual opening.',
        hookRating: 'scroll-stopping',
        timeToHook: 'Under 3 seconds',
        suggestions: [],
      },
      pacing: {
        overall: 'tight',
        assessment: 'Well-paced throughout.',
        deadSpots: [],
        recommendations: [],
      },
      messagingClarity: {
        primaryMessage: 'Core brand message.',
        clarity: 'crystal-clear',
        messageRetention: 'High retention expected.',
        improvements: [],
      },
      ctaEffectiveness: {
        hasCta: true,
        ctaText: 'Shop now',
        placement: 'strong-close',
        urgency: 'compelling',
        suggestions: [],
      },
      emotionalRationalBalance: {
        balance: 'emotion-led',
        assessment: 'Strong emotional content.',
        emotionalMoments: ['Opening scene'],
        rationalElements: ['Product demo'],
      },
      // audienceFit intentionally omitted
    };

    render(<ShortFormWorkspace data={dataWithoutAudienceFit} isStreaming={false} />);
    expect(screen.getByText('Audience fit data not available for this analysis')).toBeInTheDocument();
  });
});
