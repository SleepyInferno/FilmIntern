export interface ScreenplayElement {
  type: 'scene-heading' | 'character' | 'dialogue' | 'parenthetical' | 'action' | 'transition';
  text: string;
}

export interface ScreenplayStructure {
  isScreenplay: boolean;
  elements: ScreenplayElement[];
}

const SCENE_HEADING_RE = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s+.+/i;
const TRANSITION_RE = /^[A-Z\s]+TO:$/;
const PARENTHETICAL_RE = /^\(.*\)$/;
// Character: ALL CAPS (with allowed chars: letters, spaces, periods, hyphens, apostrophes), optional parenthetical like (V.O.)
// Must be at least 2 chars, not a scene heading, not a transition
const CHARACTER_RE = /^[A-Z][A-Z\s.\-']{1,}(\s*\(.*\))?$/;

export function detectScreenplayStructure(text: string): ScreenplayStructure {
  if (!text.trim()) {
    return { isScreenplay: false, elements: [] };
  }

  const lines = text.split('\n');
  const elements: ScreenplayElement[] = [];
  let prevType: ScreenplayElement['type'] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (SCENE_HEADING_RE.test(line)) {
      elements.push({ type: 'scene-heading', text: line });
      prevType = 'scene-heading';
    } else if (TRANSITION_RE.test(line)) {
      elements.push({ type: 'transition', text: line });
      prevType = 'transition';
    } else if (PARENTHETICAL_RE.test(line)) {
      elements.push({ type: 'parenthetical', text: line });
      prevType = 'parenthetical';
    } else if (CHARACTER_RE.test(line) && !SCENE_HEADING_RE.test(line) && !TRANSITION_RE.test(line)) {
      elements.push({ type: 'character', text: line });
      prevType = 'character';
    } else if (prevType === 'character' || prevType === 'parenthetical') {
      elements.push({ type: 'dialogue', text: line });
      prevType = 'dialogue';
    } else {
      elements.push({ type: 'action', text: line });
      prevType = 'action';
    }
  }

  // Heuristic: isScreenplay if we found at least 2 scene headings
  const sceneHeadingCount = elements.filter(e => e.type === 'scene-heading').length;
  const isScreenplay = sceneHeadingCount >= 2;

  return { isScreenplay, elements };
}
