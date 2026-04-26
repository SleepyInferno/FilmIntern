export function applyAcceptedRewrites(
  scriptText: string,
  suggestions: Array<{ originalText: string; rewriteText: string; status: string }>
): string {
  const accepted = suggestions
    .filter(s => s.status === 'accepted')
    .map(s => ({ original: s.originalText, rewrite: s.rewriteText }));

  if (accepted.length === 0) return scriptText;

  // Walk the script left-to-right and bind each accepted suggestion to its
  // *next available* occurrence past the cursor. Earlier versions used
  // scriptText.indexOf(originalText) up front, so two accepted suggestions
  // sharing the same originalText (a duplicated dialogue line, an action
  // beat repeated in two scenes) both resolved to the first occurrence and
  // the second silently dropped on export.
  const parts: string[] = [];
  let cursor = 0;
  const remaining = [...accepted];

  while (remaining.length > 0) {
    let bestIdx = -1;
    let bestPos = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const pos = scriptText.indexOf(remaining[i].original, cursor);
      if (pos !== -1 && pos < bestPos) {
        bestPos = pos;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break; // none of the remaining suggestions match anywhere past cursor

    const s = remaining.splice(bestIdx, 1)[0];
    parts.push(scriptText.slice(cursor, bestPos));
    parts.push(s.rewrite);
    cursor = bestPos + s.original.length;
  }

  parts.push(scriptText.slice(cursor));
  return parts.join('');
}
