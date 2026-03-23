import { diffWordsWithSpace, type Change } from 'diff';

export type { Change } from 'diff';

export function computeWordDiff(original: string, rewrite: string): Change[] {
  return diffWordsWithSpace(original, rewrite);
}
