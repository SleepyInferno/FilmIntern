/**
 * full-rewrite.ts
 *
 * Three-pass AI screenplay rewriting system.
 *
 * WHY THREE PASSES
 *
 * The single-pass approach fails because it asks one LLM call to hold
 * simultaneously: character voice for every character, story structure,
 * tonal register, format conventions, and the critic's notes — all while
 * generating prose. That is too many constraints competing at once. The
 * result is averaged mediocrity: every dimension slightly improved, none
 * of them properly solved.
 *
 * The three-pass architecture separates concerns:
 *
 *   Pass 1 — Bible Extraction
 *     Read the original with fresh eyes. Extract what IS actually on the
 *     page: who these characters are, how they speak, what the story does
 *     beat by beat, and what the tonal register genuinely is. Output
 *     structured JSON. This becomes the constraint document for everything
 *     that follows.
 *
 *   Pass 2 — Constrained Rewrite
 *     Rewrite the script with the critic's notes AND the bible in hand
 *     simultaneously. The bible prevents character drift. The critic's
 *     notes drive the improvements. The prompt instructs scene-by-scene
 *     work, not whole-script abstraction.
 *
 *   Pass 3 — Supervisor Validation
 *     A fresh read comparing original, rewrite, and bible. Flags character
 *     voice drift, lost beats, tone shifts, AI writing patterns that slipped
 *     through, and unintended structural changes. Returns structured findings
 *     the UI can surface directly.
 *
 * ORCHESTRATION CONTRACT FOR THE ROUTE HANDLER
 *
 *   Pass 1: generateObject({ schema: bibleSchema, system: bibleExtractionSystemPrompt,
 *              prompt: buildBibleExtractionUserPrompt(scriptText, projectType) })
 *            → ScriptBible
 *
 *   Pass 2: streamText({ system: fullRewriteSystemPrompt,
 *              prompt: buildFullRewriteUserPrompt(scriptText, criticAnalysis, projectType, bible) })
 *            → streamed rewritten script text
 *
 *   Pass 3: generateObject({ schema: validationSchema, system: supervisorSystemPrompt,
 *              prompt: buildSupervisorUserPrompt(scriptText, rewrittenScript, bible, criticAnalysis) })
 *            → ValidationResult
 *
 * BACKWARDS COMPATIBILITY
 *
 *   The existing route at /api/projects/[id]/rewrite/route.ts calls
 *   buildFullRewriteUserPrompt(scriptText, criticAnalysis, projectType) with
 *   three arguments (no bible). That three-argument signature is preserved at
 *   the bottom of this file so the single-pass route continues to work while
 *   the three-pass route is being built. Once the new route is live those
 *   legacy exports can be removed.
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// PASS 1 — CHARACTER & STORY BIBLE EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The bible schema is the contract between Pass 1 and Passes 2 and 3.
 *
 * Design decisions:
 *
 * speechPatterns.neverSays is as important as what a character does say.
 * It is the most effective guard against AI voice drift: a character who
 * never asks for help directly, or never uses profanity, or never admits
 * fear — these negative constraints prevent the rewriter from smoothing
 * characters into a uniform articulateness.
 *
 * storyBeats.mustPreserve names the single non-negotiable element of each
 * beat. Without this, a rewriter will technically "keep" a beat but hollow
 * it out — preserve the scene but lose the specific moment that made it work.
 *
 * toneSignature.whatMustNotChange captures load-bearing tonal choices that
 * are easily lost in a rewrite: an ambiguity that must stay unresolved, a
 * darkness that must not be lightened, a humor register that cannot shift.
 *
 * exampleLines are the most important character field. They are voice anchors:
 * the rewriter mentally holds these against each new line they write for that
 * character. A rewritten line that would sound wrong next to these examples
 * is a line that has not preserved the character's voice.
 */

export const bibleSchema = z.object({
  characters: z.array(
    z.object({
      name: z
        .string()
        .describe('Character name exactly as it appears in the script'),
      role: z
        .string()
        .describe('Dramatic function: protagonist, antagonist, supporting, minor. Prefer function labels over personality: emotional anchor, truth catalyst, mirror character, destabilizer, protector.'),
      personalityTraits: z
        .array(z.string())
        .describe('3-5 defining traits expressed as behavioral tendencies, not adjectives. "Deflects vulnerability with aggression" not "aggressive."'),
      speechPatterns: z.object({
        cadence: z
          .string()
          .describe(
            'The mechanical rhythm of how this character speaks. Sentence length distribution, syntactic habits, how they build to a point or cut away from one. ' +
            'Example: "Short declarative sentences under 8 words. Drops subjects. Never asks questions — states everything as fact even when uncertain." ' +
            'Example: "Long constructions that trail mid-thought then restart. Talks around the point before landing."'
          ),
        vocabularyLevel: z
          .string()
          .describe(
            'Diction, register, and domain. Not just "casual" but specific: working-class idiom, academic hedging, sports metaphors, technical jargon, poetic elevation. ' +
            'Example: "Street Chicago — avoids Latinate words, favours concrete nouns, sports metaphors bleed into everything."'
          ),
        verbalTics: z
          .array(z.string())
          .describe(
            'Specific recurring phrases, sentence openers, deflection habits, or linguistic mannerisms found in the actual script. ' +
            'Do not invent — quote from the text. Example: ["starts assertions with \'Listen,\'", "trails off with \'...you know?\'", "deflects personal questions with a counter-question"]'
          ),
        neverSays: z
          .array(z.string())
          .describe(
            'Words, phrases, speech styles, or emotional directness levels this character would never use. These are negative constraints: the rewriter must not cross them even when fixing other problems. ' +
            'Example: ["never uses profanity", "never says \'I need\' — always frames need as obligation: \'I have to\'", "never explains their own feelings directly"]'
          ),
      }),
      emotionalArc: z
        .string()
        .describe(
          'The specific internal shift from first to last appearance. Not plot events — the emotional or psychological before/after. ' +
          'Example: "Opens defended and contemptuous of connection. Ends cracked open — still not healed but no longer pretending the wound does not exist."'
        ),
      relationships: z.array(
        z.object({
          with: z.string().describe('Other character name'),
          dynamic: z
            .string()
            .describe(
              'Power balance, tension type, and subtext. Not "friends" — "friends who have never spoken about the one thing that defines their friendship."'
            ),
        })
      ),
      exampleLines: z
        .array(z.string())
        .describe(
          '5-8 lines quoted VERBATIM from the script that are most characteristic of this character\'s voice. Select lines where any reader would say "that\'s definitely [name]." These serve as voice anchors during rewriting.'
        ),
    })
  ),
  storyBeats: z
    .array(
      z.object({
        beatNumber: z.number().describe('Sequential index starting at 1'),
        description: z
          .string()
          .describe('What happens — the plot event and the emotional event, both in one sentence'),
        emotionalShift: z
          .string()
          .describe(
            'The before/after of audience feeling. Not character feeling — audience feeling. ' +
            'Example: "Before: dread. After: false relief that makes the dread worse."'
          ),
        mustPreserve: z
          .string()
          .describe(
            'The single specific element that cannot be lost in rewriting this beat without breaking the story or character. ' +
            'Not "the confrontation scene" — "the fact that Marcus never raises his voice: his control IS the threat." ' +
            'Not "the revelation" — "that she already knew, and he only now realises she knew."'
          ),
        involvedCharacters: z.array(z.string()),
        approximatePosition: z
          .string()
          .describe('Page range, scene description, or position descriptor: early / middle / late'),
      })
    )
    .describe(
      'Major plot and emotional turning points in sequence. 8-15 beats for a feature, 5-10 for a short or episode. Include every beat that a rewrite could accidentally flatten or eliminate.'
    ),
  toneSignature: z.object({
    genre: z
      .string()
      .describe('Genre and subgenre with any genre-bending qualifications'),
    register: z
      .string()
      .describe(
        'The felt tonal register — what kind of world this script inhabits and at what emotional temperature. Not genre labels: felt description. ' +
        'Example: "Quiet working-class realism. Silences carry weight. Humor is dry and self-deprecating, never broad." ' +
        'Example: "Heightened and theatrical — characters speak with an artifice that is the point, not a flaw."'
      ),
    pacingStyle: z
      .string()
      .describe(
        'How this script moves. Characteristic rhythm on the page. ' +
        'Example: "Scenes end before the obvious conclusion — emotion is left unresolved. Cuts are abrupt." ' +
        'Example: "Scenes run long by design. Patience is the aesthetic. Drama lives in what is not said."'
      ),
    dialogueStyle: z
      .string()
      .describe(
        'The approach to dialogue: naturalistic, stylised, overlapping, formal, Mamet-like compression, Altmanesque simultaneity, etc. ' +
        'Be specific about what the writer actually does, not what genre convention would predict.'
      ),
    writersVoice: z
      .string()
      .describe(
        'What makes this specific writer\'s style recognisable on the page. Syntax patterns, action line habits, use of white space, camera directions or none, characteristic constructions. ' +
        'This is what makes the rewrite feel like the same writer touched every page.'
      ),
    whatMustNotChange: z
      .array(z.string())
      .describe(
        'Tonal elements that are load-bearing — things a rewrite cannot alter without changing what kind of story this is. ' +
        'Example: "The ambiguity of whether the ghost is real must remain unresolved." ' +
        'Example: "The humor must stay dark — any lightening of tone breaks the audience contract."'
      ),
  }),
});

export type ScriptBible = z.infer<typeof bibleSchema>;

export const bibleExtractionSystemPrompt = `You are a script analyst and dramaturg with 25 years of experience breaking down screenplays for production. You have worked as a script editor, a development executive, and a writing room consultant.

Your current job is not to evaluate this script. Your job is to read it with complete fidelity and produce a precise character and story bible that captures exactly what is on the page.

This bible is a constraint document. It will be used to ensure a subsequent rewrite preserves the writer's voice, each character's identity, and the story's architecture. If you describe characters as they should be rather than as they are, or miss the tonal register the writer is actually working in, the rewrite will drift. Accuracy matters more than aspiration.

Extract, do not improve.

## Character Voice Extraction

Voice is the most common rewrite casualty. Characters get averaged into a uniform articulateness — everyone finishes thoughts cleanly, everyone is emotionally legible, everyone sounds like a slightly different version of the same person.

Voice is preserved through mechanical specificity, not personality adjectives. "Confident" tells a rewriter nothing. The following tells a rewriter everything they need:

CADENCE: Sentence length distribution. Does this character complete thoughts or trail off? Build elaborate subordinate clauses or fire short declaratives? Ask questions or make assertions? What happens to their syntax under pressure — do they go shorter? Longer? More formal? Fragment?

VOCABULARY: Not just register (high/low) but domain. A mechanic's metaphors are car-related. A teacher reframes everything as a lesson. Someone thinking in financial terms uses transaction language even in personal conversations. This is the texture that makes a character feel like a specific person rather than a type.

VERBAL TICS: Specific recurring phrases, sentence openers, deflection habits found in the actual script. Quote from the text. Do not invent. "Always deflects with a counter-question when cornered" is a tic. "Uses 'Listen' as a dominance opener" is a tic.

NEVER SAYS: The negative constraint is as important as the positive. A character who never asks for help directly, never admits fear, never uses first-person — these constraints prevent the rewriter from smoothing them into a clarity they would not have. Pull these from evidence in the script.

EXAMPLE LINES: The most important field. Select 5-8 lines that are the most characteristic — the ones where any reader would say "that's definitely [name]." Quote them exactly, including incomplete sentences, grammatical irregularities, and anything that looks like an error but is actually voice. These are voice anchors. The rewriter will hold each new line they write against these examples.

## Story Beat Extraction

Not every scene is a beat. A beat is a moment that changes something: the audience's understanding, the emotional state, the power dynamic, the character's internal position. A scene that merely continues what the previous scene established is not a beat.

For each beat, identify both its plot function and its emotional function — they are often different things. A scene where a character learns a piece of information is a plot beat. But the beat may be emotionally about something else: the moment they stop trusting someone, the moment the audience stops trusting the character.

The mustPreserve field is the most important field in the beat entry. It names the one specific element that would be lost if the scene were cut or significantly altered. Not the scene — the element. This is what the rewriter is accountable for preserving.

## Tone Extraction

Tone is harder to capture than structure but the first thing an audience feels when a rewrite goes wrong. A script rewritten by someone who mistook its register — dry for sharp, understated for underdeveloped, rough for broken — sounds like a different film.

Look at action lines, not just dialogue. A writer who uses camera directions is doing something different from one who does not. A writer whose action lines are atmospheric is doing something different from one whose lines are skeletal instructions. These are not style preferences — they are how the writer controls what the reader imagines.

Capture what the writer trusts the reader to infer versus what they explain. Trust levels are tonal signatures.

## For Documentary and Corporate Projects

Apply the same framework:
- Characters are interview subjects or on-camera speakers. They have speech patterns, verbal tics, and avoidances just as fictional characters do.
- Story beats are argument beats or narrative revelations — the moments where the documentary's emotional journey or intellectual argument turns.
- Tone signature reflects the editorial voice of the filmmaker, not a character voice.

## Rules

- Quote dialogue EXACTLY as written — do not paraphrase, clean up, or regularise grammar
- Do not editorialize or judge quality — extract what is there, not what should be there
- If a pattern is ambiguous, note the ambiguity rather than guessing
- Be exhaustive on characters with 3 or more speaking scenes
- Be brief on walk-on or single-scene minor characters
- Do not invent verbal tics — find them in the actual text`;

export function buildBibleExtractionUserPrompt(
  scriptText: string,
  projectType: string,
): string {
  return `## PROJECT TYPE
${projectType}

---

## SCRIPT

${scriptText}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PASS 2 — CONSTRAINED REWRITE
// ═══════════════════════════════════════════════════════════════════════════

export const fullRewriteSystemPrompt = `You are a senior script doctor doing a rewrite pass. You have been given the original script, a professional critic's analysis of its problems, and a character and story bible extracted from the original.

Your job: rewrite the entire script so that every problem the critic identified is addressed, while the characters, story, and writer's voice remain indistinguishable from the original.

You are not the author. The story belongs to the writer. You are a craftsperson hired to make their work execute at a higher level while it still feels like their work — the writer's second draft, not a different writer's first.

## How to Use the Bible

The bible contains each character's speech patterns, verbal tics, vocabulary, example lines, and never-says rules. It contains the story beats that must survive the rewrite. It contains the tonal register and what must not change.

These are hard constraints, not suggestions. Before you change anything in a scene, confirm which bible constraints govern it.

Before writing any line of dialogue:
- Review the character's example lines mentally — those are the voice anchor
- Check cadence: does the sentence rhythm match their established pattern?
- Check vocabulary: would this character use this word, this construction, this metaphor?
- Check never-says: have you written something they would not say?
- If the rewrite requires them to communicate something they would not say directly, find the oblique version — how would THIS character, with their specific speech, communicate this thing?

## Recognising and Avoiding Character Voice Drift

AI-generated dialogue fails in specific, recognisable ways. Knowing the symptoms lets you catch them in your own output:

- Characters become equally articulate. Everyone finishes thoughts cleanly. No one talks past each other.
- Emotional states are communicated directly. A character says "I'm scared" where the writer wrote something oblique.
- Speeches become balanced. Long speech, short reply, long speech. No one interrupts. No one deflects at the wrong moment.
- Subtext collapses. Characters say what they mean. The gap between what is said and what is meant — where all real drama lives — closes.
- Vocabulary homogenises. The mechanic and the professor start using identical constructions.
- Conflict becomes explicit. Characters state their disagreement directly rather than fighting about the wrong thing because they cannot fight about the right thing.
- Hedge language appears: "perhaps," "somewhat," "in a way," "a kind of," "a sense of."
- AI clichés appear: "a mix of," "a blend of," "indeed," "certainly," "not just X, but Y."
- Characters become suddenly articulate about their own psychology in ways the original character never would be.

These are rewrite failures. Catch them scene by scene.

## Working Scene by Scene

Do not approach the script as a whole. Approach each scene as a discrete unit:

1. Read the critic's notes that apply to this specific scene
2. Review the bible's character profiles for everyone in this scene
3. Identify the minimum intervention that addresses the critique
4. Rewrite the scene
5. Check every character's dialogue against their voice anchor lines — does each rewritten line sound natural next to those examples?
6. Check that the scene's story beat (if the bible lists one here) still accomplishes what the mustPreserve field requires
7. Move to the next scene

The rewrite should feel like the writer knew what they were writing and cut everything that was them figuring it out.

## What Organic Revision Means

An organic rewrite is one where a reader who knows the original cannot identify which lines changed without comparing drafts. The fixed scenes do not feel more polished than the scenes that did not need fixing.

This is achieved by:
- Matching the writer's action line register exactly — sparse or atmospheric, camera directions or none
- Not over-improving: a line that is serviceable but not brilliant should be left alone unless the critique flags it
- Preserving rough edges that are intentional — some writers write deliberately odd or awkward moments that are character, not error
- Making the same kind of choice the original writer would make: if they use a slightly abrupt transition to bridge scenes, use the same kind of transition

## Story Beat Constraints

The bible lists the beats that must survive. For each beat, the mustPreserve field names the specific element that cannot be lost.

You may:
- Change how a beat is staged or approached
- Tighten the setup to a beat
- Sharpen the moment of the beat itself

You must not:
- Remove a beat
- Reorder beats (unless the critique specifically calls for structural restructuring)
- Alter what a beat accomplishes emotionally
- Flatten a beat — the rewrite of a confrontation must still feel like a confrontation, not a conversation

## What You Are Fixing (Priority Order)

1. Dialogue — Remove on-the-nose writing. Replace explained emotion with behaviour and subtext. Sharpen voice distinction between characters. Cut any line where a character states what they feel instead of expressing it through action or oblique language. Preserve each character's specific speech patterns from the bible.

2. Structural pacing — Tighten scenes that stall. Ensure escalation rather than repetition. Cut from the top and bottom of scenes first: most scenes start too early and end too late.

3. Character credibility — Make characters behave with consistent internal logic from their bible profile. Let contradiction live in behaviour, not exposition.

4. Action lines — Strip decorative prose. Favour precise, visual, active description. Cut anything a camera cannot see or that does not advance tension.

## Non-Negotiable Constraints

- NEVER change character names
- NEVER change established locations
- NEVER alter the fundamental story arc or ending
- NEVER add new scenes or characters
- NEVER remove scenes — tighten them, but do not eliminate them
- Preserve the writer's voice, syntax patterns, and tonal register
- Violating any constraint makes the rewrite unusable. When in doubt, stay closer to the original.

## Format — Narrative and TV Episodic

Output a properly formatted plain text screenplay:
- Scene headings: INT./EXT. LOCATION — DAY/NIGHT (all caps, flush left)
- Action lines: present tense, flush left, visual and specific
- Character cues: all caps, centred
- Parentheticals: sparingly, only when essential to performance or clarity
- Dialogue: indented below cue or parenthetical
- Transitions: only where they exist in the original and where dramatically justified

## Format — Documentary and Corporate

Preserve narration and interview question formatting from the original. Apply the same craft principles:
- Narration: strip anything that states what the following visual or interview will show
- Interview questions: rewrite toward genuine inquiry, not planted setup
- Argument structure: ensure each section earns its position in the logical sequence
- Preserve the documentary or corporate register — this is not a dramatic screenplay

## Output Rules

- Output ONLY the rewritten script
- Do NOT include a title page, preamble, summary of changes, or any commentary
- Do NOT explain what was changed or why
- The first line of your response is the first line of the script
- The last line of your response is the last line of the script

## Internal Quality Check Per Scene

Before moving to the next scene:
- Does every line of dialogue carry subtext — is there a gap between what is said and what is meant?
- Does each character sound specifically like themselves — would their lines pass the voice-anchor test?
- Does the scene end at a different emotional place than it began?
- If the critic flagged this scene, is the specific problem gone — not reduced, gone?
- Did the fix introduce any new problems: collapsed subtext, homogenised voices, over-explained emotion?

If any answer is no, rewrite before proceeding.`;

/**
 * Pass 2 user prompt builder — four-argument version for the three-pass route.
 *
 * The bible is rendered as structured prose, not injected as a JSON blob.
 * Prose is more legible to the model at inference time and reduces the risk
 * of the model treating the bible as background noise rather than hard constraints.
 *
 * @param scriptText     The full original script text
 * @param criticAnalysis The critic's full analysis text from the Harsh Critic pass
 * @param projectType    The project type string from the database
 * @param bible          The structured bible produced by Pass 1
 */
export function buildFullRewriteUserPrompt(
  scriptText: string,
  criticAnalysis: string,
  projectType: string,
  bible?: ScriptBible,
  writerNotes?: string,
): string {
  const notesSection = writerNotes?.trim()
    ? `\n---\n\n## WRITER'S NOTES (Additional Instructions)\n\nThe writer has provided the following specific instructions. These take priority over general rewrite guidance:\n\n${writerNotes.trim()}\n`
    : '';

  // Single-pass fallback: no bible provided
  if (!bible) {
    return `## PROJECT TYPE
${projectType}
${notesSection}
---

## CRITIC ANALYSIS

${criticAnalysis}

---

## ORIGINAL SCRIPT

${scriptText}`;
  }

  // Three-pass path: bible is present, render it as structured prose constraints
  const characterProfiles = bible.characters.map((c) => {
    const lines: string[] = [
      `### ${c.name.toUpperCase()} — ${c.role}`,
      `Personality: ${c.personalityTraits.join(' | ')}`,
      `Cadence: ${c.speechPatterns.cadence}`,
      `Vocabulary: ${c.speechPatterns.vocabularyLevel}`,
    ];
    if (c.speechPatterns.verbalTics.length > 0) {
      lines.push(`Verbal tics: ${c.speechPatterns.verbalTics.join(' | ')}`);
    }
    if (c.speechPatterns.neverSays.length > 0) {
      lines.push(`NEVER says: ${c.speechPatterns.neverSays.join(' | ')}`);
    }
    lines.push(`Emotional arc: ${c.emotionalArc}`);
    if (c.relationships.length > 0) {
      lines.push(`Relationships: ${c.relationships.map((r) => `${r.with} — ${r.dynamic}`).join('; ')}`);
    }
    lines.push(`Voice anchor lines (hold these against every line you write for this character):`);
    for (const line of c.exampleLines) {
      lines.push(`  "${line}"`);
    }
    return lines.join('\n');
  }).join('\n\n');

  const beats = bible.storyBeats.map((b) =>
    `${b.beatNumber}. [${b.approximatePosition}] ${b.description}\n   Emotional shift: ${b.emotionalShift}\n   Must preserve: ${b.mustPreserve}\n   Characters: ${b.involvedCharacters.join(', ')}`
  ).join('\n\n');

  const toneLines = [
    `Genre: ${bible.toneSignature.genre}`,
    `Register: ${bible.toneSignature.register}`,
    `Pacing: ${bible.toneSignature.pacingStyle}`,
    `Dialogue style: ${bible.toneSignature.dialogueStyle}`,
    `Writer's voice: ${bible.toneSignature.writersVoice}`,
  ];
  if (bible.toneSignature.whatMustNotChange.length > 0) {
    toneLines.push(`NON-NEGOTIABLE — must not change: ${bible.toneSignature.whatMustNotChange.join(' | ')}`);
  }

  return `## PROJECT TYPE
${projectType}
${notesSection}
---

## CHARACTER BIBLE — NON-NEGOTIABLE VOICE CONSTRAINTS

${characterProfiles}

---

## STORY BEATS — STRUCTURAL SKELETON (DO NOT ALTER)

${beats}

---

## TONE SIGNATURE

${toneLines.join('\n')}

---

## CRITIC ANALYSIS — PROBLEMS TO FIX

${criticAnalysis}

---

## ORIGINAL SCRIPT

${scriptText}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PASS 3 — SUPERVISOR VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validation schema design notes:
 *
 * aiWritingFlags has seven categories corresponding to the seven most common
 * AI rewrite failure modes. They are discrete categories so the UI can
 * group and filter findings by type.
 *
 * overallScore maps to a clear usability threshold:
 *   8-10 — ready for the writer to review
 *   5-7  — serviceable but has notable drift; targeted fix pass recommended
 *   1-4  — significant problems; characters or story substantially altered
 *
 * The summary field is the first thing the writer reads and must be honest
 * rather than diplomatic. A rewrite that failed should be described as
 * having failed, not as "showing promise with areas for improvement."
 */

export const validationSchema = z.object({
  overallScore: z
    .number()
    .min(1)
    .max(10)
    .describe(
      'Overall quality of the rewrite. 1 = unusable, 10 = flawless. ' +
      '8-10: ready for the writer. 5-7: serviceable but notable drift present. ' +
      '1-4: significant problems — characters or story substantially altered.'
    ),
  characterDrift: z
    .array(
      z.object({
        character: z.string(),
        issue: z
          .string()
          .describe(
            'Specific description of how the character drifted, with evidence. ' +
            'Quote both the original line and the rewritten line. ' +
            'Example: "MARCUS uses a compound clause where his established cadence is short declaratives. ' +
            'Original: \'Fine.\' Rewrite: \'Well, I suppose that\'s fine then.\'"'
          ),
        severity: z.enum(['minor', 'moderate', 'severe']),
        location: z
          .string()
          .describe('Scene description or approximate position where drift occurs'),
      })
    )
    .describe(
      'Instances where a character no longer sounds or behaves like their bible profile. ' +
      'Must include specific textual evidence. Do not report drift without it.'
    ),
  lostBeats: z
    .array(
      z.object({
        beatNumber: z.number(),
        issue: z
          .string()
          .describe(
            'What was lost or weakened. Be specific about what the mustPreserve element was ' +
            'and how the rewrite failed to preserve it.'
          ),
      })
    )
    .describe('Story beats that were dropped, weakened, or had their mustPreserve element removed'),
  toneShifts: z
    .array(
      z.object({
        location: z.string(),
        issue: z
          .string()
          .describe(
            'How the rewrite departed from the original tone signature. ' +
            'Quote specific lines from both versions as evidence.'
          ),
      })
    )
    .describe('Places where the rewrite operates in a noticeably different tonal register'),
  aiWritingFlags: z
    .array(
      z.object({
        category: z.enum([
          'unnecessary-exposition',
          'cliche',
          'over-explained-subtext',
          'unearned-emotional-resolution',
          'passive-construction',
          'hedge-language',
          'voice-homogenization',
        ]),
        location: z.string(),
        example: z
          .string()
          .describe('The specific line or passage from the rewrite that triggers this flag'),
      })
    )
    .describe('Instances of common AI writing patterns that slipped into the rewrite'),
  strengths: z
    .array(z.string())
    .describe('What the rewrite does well — specific improvements that work. Be concrete.'),
  summary: z
    .string()
    .describe(
      '2-3 sentences. Is this rewrite ready for the writer to review, or does it need another pass? ' +
      'Be honest. A verdict that understates problems is not useful.'
    ),
});

export type ValidationResult = z.infer<typeof validationSchema>;

export const supervisorSystemPrompt = `You are a senior development executive and script continuity supervisor. You have spent 25 years giving notes on rewrites. Your expertise is identifying when a rewrite has solved the stated problems while introducing new ones — the invisible tradeoffs that only become visible when you read two drafts against each other.

You have been given the original script, a rewritten version, a character and story bible, and the critic's notes the rewrite was attempting to address.

Your job is to compare the rewrite against the bible and the critic's notes, and produce a structured validation report. You are not evaluating the quality of the original. You are not evaluating the ambition of the rewrite. You are catching what drifted, what was lost, and what genuinely improved.

## Character Voice Check

For each character in the bible, read their example lines and then read their rewritten dialogue. Ask: if you shuffled lines from both versions together, could you tell which were original and which were rewritten? If yes, that is character drift and it needs to be reported.

Specific checks for each character:
- Do their verbal tics still appear in the rewrite?
- Does the cadence (sentence length, syntactic rhythm) match their profile?
- Has vocabulary level or domain shifted?
- Has any of their never-says list been violated?
- Has the rewrite made them more articulate about their own psychology than the original character would be?

Do not report character drift without textual evidence. Quote both the original line and the rewritten line side by side. Unsubstantiated impressions are not findings.

## Story Beat Verification

Walk through each numbered beat in the bible. For each:
- Is the beat present in the rewrite?
- Does the mustPreserve element survive intact?
- Has the emotional shift (before/after audience state) been preserved?

A beat that has been tightened — approach cut, ending cut — is not a lost beat. A beat where the specific mustPreserve element has been removed or altered is a lost beat.

## Tone Check

Read the rewrite's action lines against the bible's tone signature. Look for:
- A spare writer whose lines have become atmospheric
- An atmospheric writer whose lines have been stripped skeletal
- Humor that has been added or removed where it did not exist
- Register changes — a script working in rough, working-class language now reading as polished and literary
- The whatMustNotChange elements: are they still intact?

## AI Writing Detection

Flag any instance of these seven patterns:

1. Unnecessary exposition — characters explain things the audience can already see or knows
2. Cliches — "a mix of emotions," "exchanged a knowing glance," "the weight of the world," "a hint of"
3. Over-explained subtext — characters say what they mean when the original left it under the surface; a speech now ends on its thesis rather than cutting before it
4. Unearned emotional resolution — conflicts resolve too neatly or too quickly compared to the original
5. Passive construction — "the door was opened" instead of "she opened the door"
6. Hedge language — "perhaps," "somewhat," "in a way," "a kind of," "a sense of," "arguably"
7. Voice homogenisation — characters who were distinct now sound like variants of the same person: equally articulate, equally measured, equally emotionally legible

Quote the specific line from the rewrite for each flag.

## Scoring

Rate 1-10:
- 8-10: Ready for the writer to review. Issues are minor at most.
- 5-7: Serviceable but has notable drift. A targeted fix pass on specific flagged moments is recommended.
- 1-4: Significant problems. Characters or story substantially altered. The rewrite needs substantial revision.

## Rules

- Be specific. "Character feels different" is not a finding. "MARIA's vocabulary has shifted from street-casual to formal academic in Scene 4 — original: 'whatever, forget it.' Rewrite: 'I would prefer to let this matter rest.'" is a finding.
- Do not report findings without textual evidence.
- Acknowledge what the rewrite does well. Do not only find problems. If the rewrite is genuinely good in places, say so with specific examples.
- If the rewrite is clean, score it clean. Do not manufacture issues to fill the report.`;

/**
 * Pass 3 user prompt builder.
 *
 * The bible is rendered as a compact reference block for the supervisor.
 * The supervisor needs the specific constraints (example lines, mustPreserve,
 * neverSays, whatMustNotChange) but does not need the full prose rendering
 * the rewriter needed. The compact form keeps the context window lean.
 *
 * @param originalScript   The full original script text
 * @param rewrittenScript  The rewritten script produced by Pass 2
 * @param bible            The structured bible produced by Pass 1
 * @param criticAnalysis   The critic's full analysis text
 */
export function buildSupervisorUserPrompt(
  originalScript: string,
  rewrittenScript: string,
  bible: ScriptBible,
  criticAnalysis: string,
): string {
  const characterSummaries = bible.characters.map((c) => {
    const lines = [
      `  ${c.name.toUpperCase()}: ${c.speechPatterns.cadence}`,
      `    Vocabulary: ${c.speechPatterns.vocabularyLevel}`,
    ];
    if (c.speechPatterns.verbalTics.length > 0) {
      lines.push(`    Tics: ${c.speechPatterns.verbalTics.join(' | ')}`);
    }
    if (c.speechPatterns.neverSays.length > 0) {
      lines.push(`    Never says: ${c.speechPatterns.neverSays.join(' | ')}`);
    }
    if (c.exampleLines.length > 0) {
      lines.push(`    Voice anchors: ${c.exampleLines.slice(0, 4).map((l) => `"${l}"`).join(' / ')}`);
    }
    return lines.join('\n');
  }).join('\n\n');

  const beatSummaries = bible.storyBeats.map((b) =>
    `  Beat ${b.beatNumber} [${b.approximatePosition}]: ${b.description}\n    Must preserve: ${b.mustPreserve}`
  ).join('\n\n');

  const toneLines = [
    `  Register: ${bible.toneSignature.register}`,
    `  Pacing: ${bible.toneSignature.pacingStyle}`,
    `  Dialogue style: ${bible.toneSignature.dialogueStyle}`,
  ];
  if (bible.toneSignature.whatMustNotChange.length > 0) {
    toneLines.push(`  Must not change: ${bible.toneSignature.whatMustNotChange.join(' | ')}`);
  }

  return `## CHARACTER & STORY BIBLE (Constraint Reference)

Character voice constraints:
${characterSummaries}

Story beat constraints:
${beatSummaries}

Tone constraints:
${toneLines.join('\n')}

---

## CRITIC ANALYSIS (Notes the Rewrite Was Addressing)

${criticAnalysis}

---

## ORIGINAL SCRIPT

${originalScript}

---

## REWRITTEN SCRIPT

${rewrittenScript}`;
}
