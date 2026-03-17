/**
 * Prompt builders for derivative document generation.
 * Each builder embeds sourceText and serialized analysis into the prompt.
 */

export function buildOutlinePrompt(
  sourceText: string,
  analysis: Record<string, unknown>,
  outlineMode: 'beats' | 'scene-by-scene' = 'beats'
): string {
  const modeInstruction =
    outlineMode === 'scene-by-scene'
      ? 'Create a detailed scene-by-scene outline with individual scene descriptions, transitions, and character involvement for each scene.'
      : 'Create a high-level beat outline capturing the major narrative beats, turning points, and structural milestones.';

  return `You are a professional script and content development assistant.

${modeInstruction}

Based on the following source material and analysis, generate a structured outline in Tiptap JSON format.

SOURCE TEXT:
${sourceText}

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Return a JSON object with:
- type: "doc"
- content: array of Tiptap nodes (headings, paragraphs, bulletLists)

Structure the outline with clear section headings, numbered beats or scenes, and brief descriptions for each.`;
}

export function buildTreatmentPrompt(
  sourceText: string,
  analysis: Record<string, unknown>
): string {
  return `You are a professional screenplay development assistant specializing in treatments.

Based on the following source material and analysis, generate a screenplay-oriented treatment in Tiptap JSON format.

The treatment should read as a compelling narrative document that conveys the story, characters, and emotional arc in prose form, suitable for producers, studios, and development executives.

SOURCE TEXT:
${sourceText}

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Return a JSON object with:
- type: "doc"
- content: array of Tiptap nodes (headings, paragraphs)

Structure the treatment with: Logline, Synopsis, Character Descriptions, Act Structure, and Thematic Elements.`;
}

export function buildProposalPrompt(
  sourceText: string,
  analysis: Record<string, unknown>
): string {
  return `You are a professional content strategist creating polished strategic proposals.

Based on the following source material and analysis, generate a strategic proposal/summary document in Tiptap JSON format.

The proposal should feel like a polished studio or client deliverable with strong readability, suitable for stakeholders and decision-makers.

SOURCE TEXT:
${sourceText}

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Return a JSON object with:
- type: "doc"
- content: array of Tiptap nodes (headings, paragraphs, bulletLists)

Structure the proposal with: Executive Summary, Key Findings, Strategic Recommendations, Implementation Approach, and Next Steps.`;
}
