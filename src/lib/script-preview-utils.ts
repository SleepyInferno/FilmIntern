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
    .sort((a, b) => b.index - a.index); // reverse order to prevent offset drift

  let result = scriptText;
  for (const s of accepted) {
    result = result.slice(0, s.index) + s.rewrite + result.slice(s.index + s.original.length);
  }
  return result;
}
