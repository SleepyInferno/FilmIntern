import { narrativeSuggestionPrompt } from '@/lib/ai/prompts/narrative-suggestion';
import { tvEpisodicSuggestionPrompt } from '@/lib/ai/prompts/tv-episodic-suggestion';
import { documentarySuggestionPrompt } from '@/lib/ai/prompts/documentary-suggestion';
import { corporateSuggestionPrompt } from '@/lib/ai/prompts/corporate-suggestion';

export interface WeaknessTarget {
  category: string;
  label: string;
}

export const suggestionConfig: Record<string, { prompt: string }> = {
  narrative: { prompt: narrativeSuggestionPrompt },
  'tv-episodic': { prompt: tvEpisodicSuggestionPrompt },
  documentary: { prompt: documentarySuggestionPrompt },
  corporate: { prompt: corporateSuggestionPrompt },
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
