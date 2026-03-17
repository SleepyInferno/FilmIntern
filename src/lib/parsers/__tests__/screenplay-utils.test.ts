import { describe, it, expect } from 'vitest';
import { detectScreenplayStructure } from '../screenplay-utils';

describe('detectScreenplayStructure', () => {
  it('identifies INT./EXT. scene headings and returns isScreenplay: true', () => {
    const text = 'INT. LIBRARY - DAY\n\nJANE\nHello there.\n\nEXT. PARK - NIGHT';
    const result = detectScreenplayStructure(text);
    expect(result.isScreenplay).toBe(true);
    const sceneHeadings = result.elements.filter(e => e.type === 'scene-heading');
    expect(sceneHeadings.length).toBe(2);
    expect(sceneHeadings[0].text).toBe('INT. LIBRARY - DAY');
    expect(sceneHeadings[1].text).toBe('EXT. PARK - NIGHT');
  });

  it('recognizes INT./EXT. and I/E. prefixes as scene headings', () => {
    const text = 'INT./EXT. HOUSE - DAY\n\nJOHN\nHello.\n\nI/E. BUILDING - NIGHT';
    const result = detectScreenplayStructure(text);
    expect(result.isScreenplay).toBe(true);
    const sceneHeadings = result.elements.filter(e => e.type === 'scene-heading');
    expect(sceneHeadings.length).toBe(2);
    expect(sceneHeadings[0].text).toBe('INT./EXT. HOUSE - DAY');
    expect(sceneHeadings[1].text).toBe('I/E. BUILDING - NIGHT');
  });

  it('identifies character names in ALL CAPS', () => {
    const text = 'INT. OFFICE - DAY\n\nJOHN\nHello there.\n\nEXT. PARK - NIGHT';
    const result = detectScreenplayStructure(text);
    const characters = result.elements.filter(e => e.type === 'character');
    expect(characters.length).toBe(1);
    expect(characters[0].text).toBe('JOHN');
  });

  it('identifies dialogue after character names', () => {
    const text = 'INT. OFFICE - DAY\n\nJOHN\nHello there.\n\nEXT. PARK - NIGHT';
    const result = detectScreenplayStructure(text);
    const dialogue = result.elements.filter(e => e.type === 'dialogue');
    expect(dialogue.length).toBe(1);
    expect(dialogue[0].text).toBe('Hello there.');
  });

  it('identifies transitions ending with TO:', () => {
    const text = 'INT. OFFICE - DAY\n\nAction line.\n\nCUT TO:\n\nEXT. PARK - NIGHT';
    const result = detectScreenplayStructure(text);
    const transitions = result.elements.filter(e => e.type === 'transition');
    expect(transitions.length).toBe(1);
    expect(transitions[0].text).toBe('CUT TO:');
  });

  it('identifies parentheticals', () => {
    const text = 'INT. OFFICE - DAY\n\nJOHN\n(beat)\nHello there.\n\nEXT. PARK - NIGHT';
    const result = detectScreenplayStructure(text);
    const parentheticals = result.elements.filter(e => e.type === 'parenthetical');
    expect(parentheticals.length).toBe(1);
    expect(parentheticals[0].text).toBe('(beat)');
  });

  it('returns isScreenplay: false for plain prose', () => {
    const result = detectScreenplayStructure('This is a regular paragraph about libraries.');
    expect(result.isScreenplay).toBe(false);
    expect(result.elements.length).toBeGreaterThan(0);
    expect(result.elements[0].type).toBe('action');
  });

  it('handles empty text input', () => {
    const result = detectScreenplayStructure('');
    expect(result.isScreenplay).toBe(false);
    expect(result.elements).toEqual([]);
  });
});
