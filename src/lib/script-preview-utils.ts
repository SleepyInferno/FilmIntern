export function applyAcceptedRewrites(
  scriptText: string,
  suggestions: Array<{ originalText: string; rewriteText: string; status: string }>
): string {
  const accepted = suggestions
    .filter(s => s.status === 'accepted')
    .map(s => ({
      original: s.originalText,
      rewrite: s.rewriteText,
      index: scriptText.indexOf(s.originalText),
    }))
    .filter(s => s.index !== -1)
    .sort((a, b) => a.index - b.index); // ascending for forward scan

  if (accepted.length === 0) return scriptText;

  // Array-join approach: O(1) string allocations instead of O(n) copies
  const parts: string[] = [];
  let cursor = 0;
  for (const s of accepted) {
    if (s.index < cursor) continue; // overlapping replacement, skip
    parts.push(scriptText.slice(cursor, s.index));
    parts.push(s.rewrite);
    cursor = s.index + s.original.length;
  }
  parts.push(scriptText.slice(cursor));
  return parts.join('');
}
