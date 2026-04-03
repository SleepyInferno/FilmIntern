/**
 * Screenplay plain-text parser.
 *
 * Converts raw screenplay text into typed elements (scene heading,
 * character, dialogue, parenthetical, transition, action) so that
 * exporters can apply proper screenplay formatting.
 */

export type ScreenplayElementType =
  | 'scene-heading'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition'
  | 'action'
  | 'blank';

export interface ScreenplayElement {
  type: ScreenplayElementType;
  text: string;
}

/** Scene heading prefixes (case-insensitive). */
const SCENE_HEADING_RE = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\s)/i;

/** Transition patterns — ALL CAPS ending with TO: or specific keywords. */
const TRANSITION_RE = /^[A-Z\s]+TO:$/;
const FIXED_TRANSITIONS = new Set(['FADE IN:', 'FADE OUT.', 'FADE TO BLACK.', 'CUT TO BLACK.']);

/**
 * Returns true if the trimmed line is ALL CAPS (letters only, ignoring
 * punctuation and numbers). Must contain at least one letter.
 */
function isAllCaps(line: string): boolean {
  const letters = line.replace(/[^A-Za-z]/g, '');
  return letters.length > 0 && letters === letters.toUpperCase();
}

/**
 * Parse screenplay plain text into an array of typed elements.
 *
 * Uses a simple state machine: after a character name we expect
 * parentheticals or dialogue; everything else is action unless
 * it matches a scene heading or transition pattern.
 */
export function parseScreenplay(text: string): ScreenplayElement[] {
  const rawLines = text.replace(/\r\n/g, '\n').split('\n');
  const elements: ScreenplayElement[] = [];

  let prevType: ScreenplayElementType = 'blank';
  let prevBlank = true;

  for (const raw of rawLines) {
    const trimmed = raw.trim();

    // Blank line
    if (trimmed === '') {
      elements.push({ type: 'blank', text: '' });
      prevBlank = true;
      prevType = 'blank';
      continue;
    }

    // Scene heading
    if (SCENE_HEADING_RE.test(trimmed)) {
      elements.push({ type: 'scene-heading', text: trimmed });
      prevBlank = false;
      prevType = 'scene-heading';
      continue;
    }

    // Fixed transitions (FADE IN:, FADE OUT., etc.)
    if (FIXED_TRANSITIONS.has(trimmed.toUpperCase())) {
      elements.push({ type: 'transition', text: trimmed.toUpperCase() });
      prevBlank = false;
      prevType = 'transition';
      continue;
    }

    // Transition — ALL CAPS ending with TO:
    if (TRANSITION_RE.test(trimmed) && prevBlank) {
      elements.push({ type: 'transition', text: trimmed });
      prevBlank = false;
      prevType = 'transition';
      continue;
    }

    // Parenthetical — in parens, follows character or dialogue
    if (
      trimmed.startsWith('(') &&
      trimmed.endsWith(')') &&
      (prevType === 'character' || prevType === 'dialogue')
    ) {
      elements.push({ type: 'parenthetical', text: trimmed });
      prevBlank = false;
      prevType = 'parenthetical';
      continue;
    }

    // Dialogue — follows character or parenthetical
    if (prevType === 'character' || prevType === 'parenthetical') {
      elements.push({ type: 'dialogue', text: trimmed });
      prevBlank = false;
      prevType = 'dialogue';
      continue;
    }

    // Continuation dialogue — follows previous dialogue without a blank line
    if (prevType === 'dialogue' && !prevBlank) {
      elements.push({ type: 'dialogue', text: trimmed });
      prevBlank = false;
      continue;
    }

    // Character name — ALL CAPS, preceded by blank line, not a heading/transition
    if (prevBlank && isAllCaps(trimmed) && trimmed.length <= 60) {
      elements.push({ type: 'character', text: trimmed });
      prevBlank = false;
      prevType = 'character';
      continue;
    }

    // Default: action
    elements.push({ type: 'action', text: trimmed });
    prevBlank = false;
    prevType = 'action';
  }

  return elements;
}
