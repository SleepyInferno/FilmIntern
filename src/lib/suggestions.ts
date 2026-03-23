import { narrativeSuggestionPrompt, narrativeCriticSuggestionPrompt } from '@/lib/ai/prompts/narrative-suggestion';
import { tvEpisodicSuggestionPrompt, tvEpisodicCriticSuggestionPrompt } from '@/lib/ai/prompts/tv-episodic-suggestion';
import { documentarySuggestionPrompt, documentaryCriticSuggestionPrompt } from '@/lib/ai/prompts/documentary-suggestion';
import { corporateSuggestionPrompt, corporateCriticSuggestionPrompt } from '@/lib/ai/prompts/corporate-suggestion';

export interface WeaknessTarget {
  category: string;
  label: string;
}

export const suggestionConfig: Record<string, { prompt: string; criticPrompt: string }> = {
  narrative: { prompt: narrativeSuggestionPrompt, criticPrompt: narrativeCriticSuggestionPrompt },
  'tv-episodic': { prompt: tvEpisodicSuggestionPrompt, criticPrompt: tvEpisodicCriticSuggestionPrompt },
  documentary: { prompt: documentarySuggestionPrompt, criticPrompt: documentaryCriticSuggestionPrompt },
  corporate: { prompt: corporateSuggestionPrompt, criticPrompt: corporateCriticSuggestionPrompt },
};

export function extractWeaknesses(analysisData: Record<string, unknown>, projectType: string): WeaknessTarget[] {
  switch (projectType) {
    case 'narrative':
      return extractNarrativeWeaknesses(analysisData);
    case 'tv-episodic':
      return extractTvEpisodicWeaknesses(analysisData);
    case 'documentary':
      return extractDocumentaryWeaknesses(analysisData);
    case 'corporate':
      return extractCorporateWeaknesses(analysisData);
    default:
      return [];
  }
}

// Critic analysis sections that yield actionable rewrite targets (sections 1-8, skip 9 priorities and 10 verdict)
const CRITIC_SECTIONS: { title: string; category: string }[] = [
  { title: 'Story Angle Under Pressure', category: 'story_angle' },
  { title: 'Primary Structural Problems', category: 'structural' },
  { title: 'Where the Script Loses Power', category: 'power_loss' },
  { title: 'Character Credibility Problems', category: 'character' },
  { title: 'On-the-Nose Dialogue Pass', category: 'dialogue' },
  { title: 'Emotional Payoff Problems', category: 'emotional' },
  { title: 'What a Tough Industry Reader Would Flag Immediately', category: 'reader_flags' },
  { title: 'Cut / Trim / Combine Recommendations', category: 'cuts' },
];

export function extractCriticWeaknesses(criticText: string): WeaknessTarget[] {
  const weaknesses: WeaknessTarget[] = [];

  for (let i = 0; i < CRITIC_SECTIONS.length; i++) {
    const section = CRITIC_SECTIONS[i];
    const nextSection = CRITIC_SECTIONS[i + 1];

    // Match the section header flexibly: ## N. Title, **N. Title**, or plain N. Title
    const headerPattern = new RegExp(
      `(?:#{1,3}\\s*)?(?:\\*\\*)?\\d+\\.\\s+${section.title.replace(/[/()]/g, '\\$&')}(?:\\*\\*)?\\s*\\n`,
      'i'
    );
    const headerMatch = headerPattern.exec(criticText);
    if (!headerMatch) continue;

    const contentStart = headerMatch.index + headerMatch[0].length;

    // Find where the next section starts (or end of text)
    let contentEnd = criticText.length;
    if (nextSection) {
      const nextPattern = new RegExp(
        `(?:#{1,3}\\s*)?(?:\\*\\*)?\\d+\\.\\s+${nextSection.title.replace(/[/()]/g, '\\$&')}`,
        'i'
      );
      const nextMatch = nextPattern.exec(criticText.slice(contentStart));
      if (nextMatch) {
        contentEnd = contentStart + nextMatch.index;
      }
    }

    const content = criticText.slice(contentStart, contentEnd).trim();
    if (content.length < 30) continue; // Skip empty or near-empty sections

    weaknesses.push({
      category: section.category,
      label: content,
    });
  }

  return weaknesses;
}

function extractNarrativeWeaknesses(data: Record<string, unknown>): WeaknessTarget[] {
  const weaknesses: WeaknessTarget[] = [];
  const story = data.storyStructure as { structuralWeaknesses?: string[] } | undefined;
  for (const w of story?.structuralWeaknesses ?? []) {
    weaknesses.push({ category: 'storyStructure', label: `Structural weakness: ${w}` });
  }
  const coverage = data.scriptCoverage as {
    characters?: { name: string; weaknesses?: string[] }[];
    dialogueQuality?: { weaknesses?: string[] };
    overallWeaknesses?: string[];
  } | undefined;
  for (const char of coverage?.characters ?? []) {
    for (const w of char.weaknesses ?? []) {
      weaknesses.push({ category: 'character', label: `${char.name}: ${w}` });
    }
  }
  for (const w of coverage?.dialogueQuality?.weaknesses ?? []) {
    weaknesses.push({ category: 'dialogue', label: `Dialogue: ${w}` });
  }
  for (const w of coverage?.overallWeaknesses ?? []) {
    weaknesses.push({ category: 'overall', label: w });
  }
  for (const r of (data.developmentRecommendations as string[] | undefined) ?? []) {
    weaknesses.push({ category: 'recommendation', label: r });
  }
  return weaknesses;
}

function extractTvEpisodicWeaknesses(data: Record<string, unknown>): WeaknessTarget[] {
  const weaknesses: WeaknessTarget[] = [];
  const episode = data.episodeAnalysis as {
    storyStrands?: { strand: string; description: string; effectiveness: string }[];
    characterIntroductions?: { character: string; introMethod: string; effectiveness: string }[];
    coldOpen?: { hookStrength: string; notes: string };
    episodeArc?: { pacing: string };
  } | undefined;
  for (const strand of episode?.storyStrands ?? []) {
    if (strand.effectiveness === 'underdeveloped') {
      weaknesses.push({ category: 'storyStrand', label: `Underdeveloped ${strand.strand}: ${strand.description}` });
    }
  }
  for (const intro of episode?.characterIntroductions ?? []) {
    if (intro.effectiveness === 'flat') {
      weaknesses.push({ category: 'characterIntro', label: `Flat introduction: ${intro.character}` });
    }
  }
  if (episode?.coldOpen?.hookStrength === 'weak') {
    weaknesses.push({ category: 'coldOpen', label: `Weak cold open: ${episode.coldOpen.notes}` });
  }
  if (episode?.episodeArc?.pacing === 'uneven' || episode?.episodeArc?.pacing === 'slow') {
    weaknesses.push({ category: 'pacing', label: `Pacing issue: ${episode.episodeArc.pacing}` });
  }
  const series = data.seriesAnalysis as {
    seasonArcPotential?: { concerns?: string[] };
  } | undefined;
  for (const c of series?.seasonArcPotential?.concerns ?? []) {
    weaknesses.push({ category: 'seasonArc', label: `Season arc concern: ${c}` });
  }
  return weaknesses;
}

function extractDocumentaryWeaknesses(data: Record<string, unknown>): WeaknessTarget[] {
  const weaknesses: WeaknessTarget[] = [];
  const editorial = data.editorialNotes as { missingPerspectives?: string[] } | undefined;
  for (const p of editorial?.missingPerspectives ?? []) {
    weaknesses.push({ category: 'missingPerspective', label: `Missing perspective: ${p}` });
  }
  const storyArc = data.storyArc as { gaps?: string[] } | undefined;
  for (const g of storyArc?.gaps ?? []) {
    weaknesses.push({ category: 'storyArcGap', label: `Story arc gap: ${g}` });
  }
  const moments = data.keyMoments as { moment: string; type: string; significance: string }[] | undefined;
  for (const m of moments ?? []) {
    if (m.type === 'contradiction') {
      weaknesses.push({ category: 'contradiction', label: `Contradiction: ${m.moment}` });
    }
  }
  return weaknesses;
}

function extractCorporateWeaknesses(data: Record<string, unknown>): WeaknessTarget[] {
  const weaknesses: WeaknessTarget[] = [];
  const speakers = data.speakerEffectiveness as { speaker: string; areasForImprovement?: string[] }[] | undefined;
  for (const s of speakers ?? []) {
    for (const area of s.areasForImprovement ?? []) {
      weaknesses.push({ category: 'speakerImprovement', label: `${s.speaker}: ${area}` });
    }
  }
  const editorial = data.editorialNotes as { messagingGaps?: string[] } | undefined;
  for (const g of editorial?.messagingGaps ?? []) {
    weaknesses.push({ category: 'messagingGap', label: `Messaging gap: ${g}` });
  }
  const consistency = data.messageConsistency as { keyConflicts?: string[] } | undefined;
  for (const c of consistency?.keyConflicts ?? []) {
    weaknesses.push({ category: 'messageConflict', label: `Message conflict: ${c}` });
  }
  const audience = data.audienceAlignment as { suggestions?: string[] } | undefined;
  for (const s of audience?.suggestions ?? []) {
    weaknesses.push({ category: 'audienceAlignment', label: `Audience alignment: ${s}` });
  }
  return weaknesses;
}
