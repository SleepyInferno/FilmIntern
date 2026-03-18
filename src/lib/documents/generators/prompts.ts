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
      ? `You are writing a scene-by-scene outline — a detailed breakdown of every scene in story order.
For each scene include: INT/EXT location and time of day, a 2-3 sentence description of the action, which characters are present, and the dramatic function of the scene (what it establishes, escalates, or resolves).`
      : `You are writing a beat outline — a structured breakdown of the major story beats and turning points.
Group beats by act. For each beat include: a short beat name, a 2-3 sentence description of what happens, the approximate page range or position (early/mid/late), and which character(s) the beat belongs to.`;

  return `You are a professional screenplay consultant and development executive creating a formatted story outline.

Your goal is to produce a document that reads like a working industry outline — specific, story-grounded, and useful to a director, writer, or producer. Every beat or scene must come directly from the source material and analysis. Do not invent story points.

${modeInstruction}

Hard rules:
- Ground every beat or scene in the actual source material — do not invent plot points
- Be specific: name characters, name locations, describe what happens and why it matters
- Use the story angle as the structural spine — every act should advance the underlying theme
- Describe dramatic function, not just plot summary
- Keep descriptions concise and direct — one or two sentences per beat
- Flag beats that are weak or missing based on the structural analysis

SOURCE MATERIAL:
${sourceText.substring(0, 6000)}${sourceText.length > 6000 ? '\n[... material continues ...]' : ''}

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Return a Tiptap JSON document with this exact structure:

{"type":"doc","content":[...nodes...]}

Use these Tiptap node types:
- {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Title"}]}
- {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section"}]}
- {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Beat Name"}]}
- {"type":"paragraph","content":[{"type":"text","text":"Content"}]}
- {"type":"horizontalRule"} between acts

Document structure:
1. H1: [Title] — Beat Outline (or Scene Outline)
2. H2: Story Angle — one sentence, the thematic through-line from the analysis
3. H2: Act One — beats or scenes as H3 headers with paragraph descriptions
4. horizontalRule
5. H2: Act Two — beats or scenes
6. horizontalRule
7. H2: Act Three — beats or scenes
8. H2: Structural Notes — 2-3 paragraphs on what works and what needs attention

Return only the raw JSON object. No markdown fences, no preamble.`;
}

export function buildTreatmentPrompt(
  sourceText: string,
  analysis: Record<string, unknown>
): string {
  return `You are a professional screenplay development consultant writing a treatment for industry presentation.

A treatment is a narrative document — it tells the story in present-tense prose, introduces the characters, and conveys the emotional and thematic texture of the material. It should read compellingly on its own, like the best version of the story told concisely.

Your treatment must feel:
- specific and evidence-based (grounded in the actual material)
- emotionally intelligent (convey what makes this story worth telling)
- professionally formatted (ready for a producer or development executive)
- honest about both the strengths and the development stage of the material

Hard rules:
- Write in present tense, active voice
- Do not invent plot points, scenes, or character motivations not supported by the material
- Lead with what is distinctive about this story — the story angle
- Introduce characters by their dramatic function, not just personality traits
- The story section must use the structural beats from the analysis as its foundation
- The tone section must be specific — name comparable titles if the analysis suggests them
- Development notes must be honest and actionable

SOURCE MATERIAL:
${sourceText.substring(0, 6000)}${sourceText.length > 6000 ? '\n[... material continues ...]' : ''}

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Return a Tiptap JSON document with this exact structure:

{"type":"doc","content":[...nodes...]}

Use these Tiptap node types:
- {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Title"}]}
- {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section"}]}
- {"type":"paragraph","content":[{"type":"text","text":"Content"}]}
- {"type":"horizontalRule"} between major sections
- {"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Item"}]}]}]}

Document structure:
1. H1: [Title]
2. Paragraph: Logline — one sentence, compelling and specific
3. horizontalRule
4. H2: Story Angle — one paragraph on what the story is really about beneath the plot
5. H2: Format & Tone — genre, tone, comparable titles, intended audience
6. horizontalRule
7. H2: Characters — one paragraph per principal character covering dramatic function, arc, and inner conflict
8. horizontalRule
9. H2: The Story — 3 to 5 paragraphs of narrative prose following the act structure: setup, escalation, turning point, climax, resolution
10. horizontalRule
11. H2: Development Notes — honest, specific notes on what is working and where the material needs attention

Return only the raw JSON object. No markdown fences, no preamble.`;
}

export function buildProposalPrompt(
  sourceText: string,
  analysis: Record<string, unknown>
): string {
  return `You are a professional content strategist and communications consultant creating a polished strategic proposal.

The proposal should read as a clean, persuasive deliverable suitable for brand stakeholders, client presentations, or internal decision-making. It must be grounded in the actual material and analysis — no generic filler, no invented findings.

Hard rules:
- Every finding must be traceable to the source material or analysis
- Be direct and specific — name the insight, explain why it matters
- Avoid generic praise and vague recommendations
- The executive summary must give a decision-maker everything they need in 3-4 sentences
- Recommendations must be actionable with a clear rationale

SOURCE MATERIAL:
${sourceText.substring(0, 6000)}${sourceText.length > 6000 ? '\n[... material continues ...]' : ''}

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Return a Tiptap JSON document with this exact structure:

{"type":"doc","content":[...nodes...]}

Use these Tiptap node types:
- {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Title"}]}
- {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section"}]}
- {"type":"paragraph","content":[{"type":"text","text":"Content"}]}
- {"type":"horizontalRule"} between major sections
- {"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Item"}]}]}]}

Document structure:
1. H1: [Title] — Strategic Proposal
2. H2: Executive Summary — 3-4 sentences covering the material, key findings, and recommended direction
3. horizontalRule
4. H2: Key Findings — bullet list of 4-6 specific, evidence-based findings from the analysis
5. H2: Content Assessment — 2-3 paragraphs evaluating the material's strengths and gaps
6. horizontalRule
7. H2: Strategic Recommendations — bullet list of 4-6 actionable recommendations with rationale
8. H2: Next Steps — bullet list of concrete actions, sequenced from most to least critical

Return only the raw JSON object. No markdown fences, no preamble.`;
}
