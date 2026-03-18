import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TvWorkspace } from '../tv-workspace';
import type { TvEpisodicAnalysis } from '@/lib/ai/schemas/tv-episodic';

function createMockTvEpisodicAnalysis(): TvEpisodicAnalysis {
  return {
    episodeAnalysis: {
      coldOpen: {
        description: 'A detective discovers a body in an unexpected location, establishing the central mystery.',
        hookStrength: 'strong',
        notes: 'Effective cold open that immediately hooks the viewer.',
      },
      storyStrands: [
        {
          strand: 'a-story',
          description: 'Detective Morgan investigates the downtown murder case.',
          characters: ['Morgan', 'Rivera'],
          effectiveness: 'compelling',
        },
        {
          strand: 'b-story',
          description: 'Morgan\'s complicated relationship with her ex-partner resurfaces.',
          characters: ['Morgan', 'Davis'],
          effectiveness: 'serviceable',
        },
      ],
      characterIntroductions: [
        {
          character: 'Detective Morgan',
          introMethod: 'Shown alone at crime scene, immediately establishing competence and isolation.',
          effectiveness: 'memorable',
        },
        {
          character: 'Captain Rivera',
          introMethod: 'Brief scene establishing authority and tension with Morgan.',
          effectiveness: 'adequate',
        },
      ],
      episodeArc: {
        setup: 'The discovery of the body and Morgan\'s assignment to the case.',
        escalation: 'Leads multiply and a key witness goes missing.',
        resolution: 'Morgan identifies the suspect but they escape — serialized hook remains open.',
        cliffhanger: 'Morgan receives an anonymous tip that changes everything.',
        pacing: 'well-paced',
      },
    },
    seriesAnalysis: {
      premiseLongevity: {
        assessment: 'multi-season',
        reasoning: 'The procedural format combined with strong serialized elements supports multiple seasons.',
      },
      serializedHooks: [
        {
          hook: 'Morgan\'s hidden past with the suspect organization',
          type: 'mystery',
          sustainability: 'strong',
        },
        {
          hook: 'The evolving Morgan-Davis dynamic',
          type: 'relationship',
          sustainability: 'moderate',
        },
      ],
      episodicVsSerial: {
        balance: 'balanced',
        assessment: 'Strong balance between standalone procedural cases and ongoing serialized arcs.',
      },
      seasonArcPotential: {
        suggestedArc: 'Morgan unravels a conspiracy that implicates her own department.',
        strengths: ['Clear central mystery', 'Compelling lead character'],
        concerns: ['Supporting cast needs more depth', 'Mythology risk of overcomplication'],
      },
    },
    overallScore: 8.5,
    overallSummary: 'A confident pilot with strong procedural bones and effective serialized hooks.',
    toneAndVoice: {
      tone: 'Gritty procedural with noir undertones',
      voiceConsistency: 'distinctive',
      assessment: 'The show has a clear, consistent tonal identity that sets it apart from standard procedurals.',
      comparisons: ['The Wire', 'True Detective Season 1'],
    },
    pilotEffectiveness: {
      worldBuilding: 'immersive',
      characterEstablishment: 'compelling',
      hookStrength: 'strong',
      assessment: 'An exceptional pilot that earns a series order on all pilot effectiveness metrics.',
    },
    franchisePotential: {
      potential: 'high',
      assessment: 'The IP has significant potential for spinoffs and international adaptations.',
      opportunities: ['Prequel series following Morgan\'s origin', 'International format adaptation', 'Podcast companion series'],
    },
  };
}

describe('TvWorkspace', () => {
  it('renders 6 evaluation cards with correct titles', () => {
    render(<TvWorkspace data={createMockTvEpisodicAnalysis()} isStreaming={false} />);

    expect(screen.getByText('Episode Arc')).toBeInTheDocument();
    expect(screen.getByText('Series Structure')).toBeInTheDocument();
    expect(screen.getByText('Character Development')).toBeInTheDocument();
    expect(screen.getByText('Tone & Voice')).toBeInTheDocument();
    expect(screen.getByText('Pilot Effectiveness')).toBeInTheDocument();
    expect(screen.getByText('Franchise Potential')).toBeInTheDocument();
  });

  it('renders workspace header with "Series Room Workspace" title', () => {
    render(<TvWorkspace data={createMockTvEpisodicAnalysis()} isStreaming={false} />);
    expect(screen.getByText('Series Room Workspace')).toBeInTheDocument();
  });

  it('shows skeleton cards when data is null and isStreaming is true', () => {
    const { container } = render(<TvWorkspace data={null} isStreaming={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles missing optional fields gracefully', () => {
    const dataWithoutOptionals: Partial<TvEpisodicAnalysis> = {
      episodeAnalysis: {
        coldOpen: {
          description: 'Detective discovers a body.',
          hookStrength: 'strong',
          notes: 'Effective cold open.',
        },
        storyStrands: [],
        characterIntroductions: [
          {
            character: 'Morgan',
            introMethod: 'Shown at crime scene.',
            effectiveness: 'memorable',
          },
        ],
        episodeArc: {
          setup: 'The case begins.',
          escalation: 'Complications arise.',
          resolution: 'Partial resolution.',
          pacing: 'well-paced',
        },
      },
      seriesAnalysis: {
        premiseLongevity: {
          assessment: 'multi-season',
          reasoning: 'Strong premise.',
        },
        serializedHooks: [],
        episodicVsSerial: {
          balance: 'balanced',
          assessment: 'Good balance.',
        },
        seasonArcPotential: {
          suggestedArc: 'Conspiracy arc.',
          strengths: ['Clear mystery'],
          concerns: [],
        },
      },
      // toneAndVoice, pilotEffectiveness, franchisePotential intentionally omitted
    };

    render(<TvWorkspace data={dataWithoutOptionals} isStreaming={false} />);

    expect(screen.getByText('Tone and voice data not available for this analysis')).toBeInTheDocument();
    expect(screen.getByText('Pilot effectiveness data not available for this analysis')).toBeInTheDocument();
    expect(screen.getByText('Franchise potential data not available for this analysis')).toBeInTheDocument();
  });
});
