# Phase 17: Review UI - Research

**Researched:** 2026-03-23
**Domain:** Word-level diff rendering, accept/reject state management, live script preview, single-suggestion AI regeneration
**Confidence:** HIGH

## Summary

This phase transforms the existing suggestion cards (Phase 16) into a tracked-changes review interface. The core technical challenges are: (1) computing and rendering word-level diffs between original and rewrite text, (2) adding per-suggestion accept/reject state with database persistence, (3) building a live script preview that reflects current accept/reject decisions, and (4) allowing single-suggestion regeneration via the existing AI pipeline.

The codebase already has all the infrastructure needed. The suggestions table and API route exist from Phase 16. The revision page loads project data (including `uploadData.text` for the full script) and renders suggestion cards. The main new work is: a DB migration to add a `status` column, upgrading the suggestion card to show diff highlighting + accept/reject buttons, building a script preview pane that applies accepted rewrites to the original text, and a single-suggestion regeneration endpoint.

**Primary recommendation:** Use the `diff` npm package (v8.x, `diffWordsWithSpace`) for word-level diff computation -- it is the most established library for this, returns a simple `Change[]` array, and supports word+whitespace tokenization out of the box. Render diffs inline with strikethrough/highlight spans. Keep accept/reject state in the DB with a new `status TEXT` column on `suggestions` (values: `'pending'`, `'accepted'`, `'rejected'`). Build the script preview as a `useMemo` derivation that scans the original script text and applies accepted rewrites via simple string replacement.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REVW-01 | User can view each suggestion with original block and proposed rewrite side-by-side | Upgrade `SuggestionCard` to show word-level diff via `diffWordsWithSpace` from `diff` package; render inline with added/removed styling |
| REVW-02 | User can accept or reject each suggestion individually | Add `status` column to `suggestions` table; PATCH endpoint to update status; accept/reject buttons on each card; script preview updates via `useMemo` |
| REVW-03 | Script preview updates live as user accepts/rejects suggestions | `useMemo` that takes script text + suggestions with status, applies accepted rewrites via string replacement, renders in a scrollable preview pane |
| REVW-04 | User can request a new AI rewrite for any individual suggestion | Single-suggestion regeneration endpoint (PATCH or POST to `/api/projects/[id]/suggestions/[suggestionId]/regenerate`); reuses existing `generateObject` + prompt pattern from Phase 16 |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| diff | ^8.0.4 | Word-level diff computation (`diffWordsWithSpace`) | 30M+ weekly downloads, simple Change[] output, handles word+whitespace tokenization, zero config |
| better-sqlite3 | ^12.8.0 | Status column migration, CRUD for accept/reject | Already in use |
| ai (Vercel AI SDK) | ^6.0.116 | Single-suggestion regeneration via `generateObject` | Already in use for suggestion generation |
| next | 16.1.6 | API routes for status updates and regeneration | Already the framework |
| react | 19.2.3 | `useMemo` for live preview derivation, component state | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.577.0 | Check, X, RefreshCw icons for accept/reject/regenerate | Already available |
| shadcn tooltip | (registry) | Tooltip on accept/reject/regenerate buttons | May already be installed; add if not |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `diff` (diffWordsWithSpace) | `diff-match-patch-es` | diff-match-patch operates on characters, requires post-processing for word-level; `diff` has native word-level support |
| Inline diff (single column) | Side-by-side two-column | Side-by-side wastes horizontal space; inline with strikethrough/highlight is more compact and standard for tracked changes |
| `status` column in DB | Client-only state (localStorage) | DB persistence is required (REVW-02: persists across refreshes); localStorage would not survive device changes |

**Installation:**
```bash
npm install diff && npm install -D @types/diff
```

One new dependency. Everything else is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── db.ts                              # MODIFY: add status column migration, updateSuggestionStatus(), updateSuggestionRewrite()
│   └── diff-utils.ts                      # NEW: computeWordDiff() wrapper around diffWordsWithSpace
├── app/
│   ├── api/
│   │   └── projects/
│   │       └── [id]/
│   │           └── suggestions/
│   │               ├── route.ts           # MODIFY: GET returns status field
│   │               └── [suggestionId]/
│   │                   ├── route.ts       # NEW: PATCH to update status (accept/reject/pending)
│   │                   └── regenerate/
│   │                       └── route.ts   # NEW: POST to regenerate single suggestion
│   └── revision/
│       └── [projectId]/
│           └── page.tsx                   # MODIFY: add script preview, wire accept/reject/regenerate
├── components/
│   ├── suggestion-card.tsx                # MODIFY: add diff display, accept/reject/regenerate buttons, status styling
│   ├── suggestion-list.tsx                # MODIFY: pass status-related callbacks
│   ├── script-preview.tsx                 # NEW: live-updating script text with accepted rewrites applied
│   └── diff-display.tsx                   # NEW: renders word-level diff as inline spans
```

### Pattern 1: Database Migration for Status Column
**What:** Add a `status` column to the `suggestions` table with default `'pending'`
**When to use:** Phase 17 start -- must be in place before any accept/reject logic
**Example:**
```typescript
// In db.ts getDb(), after the suggestions CREATE TABLE
try { _db.exec("ALTER TABLE suggestions ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'"); } catch { /* already exists */ }
```

### Pattern 2: Word-Level Diff with `diff` Package
**What:** Compute word-level diffs between original and rewrite text, return Change[] for rendering
**When to use:** Every suggestion card render
**Example:**
```typescript
// src/lib/diff-utils.ts
import { diffWordsWithSpace, type Change } from 'diff';

export function computeWordDiff(original: string, rewrite: string): Change[] {
  return diffWordsWithSpace(original, rewrite);
}
```

```tsx
// src/components/diff-display.tsx
import type { Change } from 'diff';

export function DiffDisplay({ changes }: { changes: Change[] }) {
  return (
    <p className="text-sm leading-relaxed">
      {changes.map((change, i) => {
        if (change.removed) {
          return <span key={i} className="bg-red-500/20 text-red-700 dark:text-red-400 line-through">{change.value}</span>;
        }
        if (change.added) {
          return <span key={i} className="bg-green-500/20 text-green-700 dark:text-green-400">{change.value}</span>;
        }
        return <span key={i}>{change.value}</span>;
      })}
    </p>
  );
}
```

### Pattern 3: Live Script Preview via useMemo
**What:** Derive the current script text by applying accepted suggestions to the original
**When to use:** Whenever suggestions or their statuses change
**Example:**
```typescript
// In revision page or script-preview component
const previewText = useMemo(() => {
  if (!scriptText || suggestions.length === 0) return scriptText;

  // Sort accepted suggestions by position in text (reverse order to prevent offset drift)
  const accepted = suggestions
    .filter(s => s.status === 'accepted')
    .map(s => ({ original: s.originalText, rewrite: s.rewriteText, index: scriptText.indexOf(s.originalText) }))
    .filter(s => s.index !== -1)
    .sort((a, b) => b.index - a.index); // reverse order: apply from end to start

  let result = scriptText;
  for (const s of accepted) {
    result = result.slice(0, s.index) + s.rewrite + result.slice(s.index + s.original.length);
  }
  return result;
}, [scriptText, suggestions]);
```

### Pattern 4: Single-Suggestion Regeneration
**What:** Reuse the existing `generateObject` + prompt pattern to regenerate one suggestion
**When to use:** User clicks regenerate on a single suggestion card
**Example:**
```typescript
// POST /api/projects/[id]/suggestions/[suggestionId]/regenerate
// 1. Load the suggestion row to get its weakness info
// 2. Load project to get analysisData + uploadData
// 3. Call generateObject with the same prompt pattern as Phase 16
// 4. Update the suggestion row with new rewriteText + reset status to 'pending'
// 5. Return the updated suggestion
```

### Pattern 5: Status Update API
**What:** Simple PATCH endpoint to toggle accept/reject/pending
**When to use:** User clicks accept or reject on a suggestion card
**Example:**
```typescript
// PATCH /api/projects/[id]/suggestions/[suggestionId]
// Body: { status: 'accepted' | 'rejected' | 'pending' }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; suggestionId: string }> }) {
  const { id, suggestionId } = await params;
  const { status } = await req.json();
  if (!['accepted', 'rejected', 'pending'].includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }
  db.updateSuggestionStatus(suggestionId, status);
  const updated = db.getSuggestion(suggestionId);
  return Response.json(updated);
}
```

### Anti-Patterns to Avoid
- **Computing diffs on every render without memoization:** `diffWordsWithSpace` is fast but should still be memoized (`useMemo`) per suggestion since suggestion text rarely changes.
- **Applying rewrites in forward order:** String replacement shifts indices. Always apply from the last match backward (highest index first) to prevent offset drift.
- **Storing diff results in the database:** Diffs are a view concern. Compute them on the client from `originalText` and `rewriteText`. The DB stores the source data only.
- **Using optimistic UI without server confirmation for status:** Accept/reject state must persist (REVW-02). Use optimistic UI for responsiveness but always PATCH to the server. On error, revert the optimistic state.
- **Regenerating by creating a new row:** Regeneration should UPDATE the existing suggestion row (new `rewriteText`, reset `status` to `'pending'`), not delete+insert. This preserves `orderIndex` and `id` stability.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Word-level diff | Character-by-character comparison | `diffWordsWithSpace` from `diff` package | Handles word boundaries, punctuation, whitespace correctly; battle-tested |
| Diff rendering | Custom tokenizer + spans | Simple map over `Change[]` with conditional className | The `diff` library returns exactly the right format for rendering |
| Accept/reject persistence | localStorage or in-memory state | SQLite column + API endpoint | Must persist across refreshes per REVW-02; localStorage doesn't survive clears |
| Script preview text | Manual text surgery | `useMemo` with reverse-order string replacement | Clean derivation, no mutation, re-derives automatically on state change |
| Single-suggestion AI call | New prompt pipeline | Reuse existing `generateObject` + `suggestionConfig` from Phase 16 | Same prompt, same schema, same provider -- just one call instead of N |

**Key insight:** The `diff` package's `diffWordsWithSpace` returns `Change[]` where each entry is `{ value: string, added?: boolean, removed?: boolean }`. This maps directly to React spans with conditional styling. No transformation layer needed.

## Common Pitfalls

### Pitfall 1: Offset Drift in Script Preview
**What goes wrong:** Accepting suggestion A shifts the text, causing suggestion B's `originalText` to appear at a different index or not be found at all.
**Why it happens:** String replacement changes the length of the text, shifting all subsequent positions.
**How to avoid:** Apply replacements in reverse order (last occurrence first). Use `lastIndexOf` or sort by position descending. This ensures each replacement doesn't affect the positions of subsequent (earlier in text) replacements.
**Warning signs:** Accepted suggestions produce garbled or duplicated text in the preview.

### Pitfall 2: Duplicate Original Text Matches
**What goes wrong:** `originalText` appears multiple times in the script (e.g., "Yes." appears in many places), and the replacement targets the wrong instance.
**Why it happens:** Simple `indexOf` finds the first occurrence, which may not be the one the AI intended.
**How to avoid:** Use `sceneHeading` as a disambiguation hint -- search for `originalText` within or near the scene heading context. If multiple matches remain, take the first one. For most suggestions, the original text spans are long enough to be unique. This is an inherent limitation of text-span anchoring (chosen in Phase 16) and is acceptable for v3.0.
**Warning signs:** Preview shows a rewrite in the wrong part of the script.

### Pitfall 3: Status Column Migration for Existing Data
**What goes wrong:** `ALTER TABLE ADD COLUMN status ... NOT NULL DEFAULT 'pending'` fails or existing rows don't get the default.
**Why it happens:** SQLite handles NOT NULL with DEFAULT correctly for ALTER TABLE -- existing rows get the default value. This is safe. But if the migration runs before the column name is referenced in queries, there's no issue.
**How to avoid:** Use the standard try/catch pattern. SQLite will apply the default to existing rows. Verify with a quick manual check after migration.
**Warning signs:** None expected -- this is well-supported by SQLite.

### Pitfall 4: Race Between Optimistic UI and Server
**What goes wrong:** User rapidly clicks accept/reject on multiple suggestions; UI state and server state diverge.
**Why it happens:** Each click fires a PATCH request. If one fails, the UI has already updated.
**How to avoid:** Update local state optimistically (immediate visual feedback), fire the PATCH, and revert on error. Use a stable key (suggestion ID) for state updates to prevent stale closures. Debouncing is NOT needed -- each click is a distinct action on a distinct suggestion.
**Warning signs:** Refresh shows different accept/reject states than what the user saw.

### Pitfall 5: Large Script Text in Preview
**What goes wrong:** Preview pane tries to render the full script text (could be 50K+ characters), causing jank.
**Why it happens:** Long text in a single DOM element is fine, but re-rendering it on every accept/reject action via `useMemo` could be slow if the diff logic is expensive.
**How to avoid:** The `useMemo` approach with string replacement is O(n * m) where n = suggestions and m = script length. For 25 suggestions and a 100KB script, this is trivial. No virtualization needed. Just ensure the preview is in a scrollable container with `max-h` and `overflow-y-auto`.
**Warning signs:** Noticeable lag when clicking accept/reject buttons.

### Pitfall 6: Regeneration Losing Context
**What goes wrong:** Regenerated suggestion has different `originalText`, breaking the preview's string matching.
**Why it happens:** The AI might pick a different passage for the same weakness on regeneration.
**How to avoid:** This is expected behavior -- the AI re-analyzes and may target a different passage. The preview will adjust automatically since it matches on the new `originalText`. Reset status to `'pending'` on regeneration so the user must re-accept.
**Warning signs:** None -- this is correct behavior.

## Code Examples

### SuggestionRow with Status (extended interface)
```typescript
// Updated in src/lib/db.ts
export interface SuggestionRow {
  id: string;
  projectId: string;
  orderIndex: number;
  sceneHeading: string | null;
  characterName: string | null;
  originalText: string;
  rewriteText: string;
  weaknessCategory: string;
  weaknessLabel: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
```

### DB Methods for Status Management
```typescript
// New methods in db object
updateSuggestionStatus(id: string, status: string): void {
  getDb().prepare('UPDATE suggestions SET status = ? WHERE id = ?').run(status, id);
},

updateSuggestionRewrite(id: string, rewriteText: string): void {
  getDb().prepare("UPDATE suggestions SET rewriteText = ?, status = 'pending' WHERE id = ?").run(rewriteText, id);
},

getSuggestion(id: string): SuggestionRow | null {
  return (getDb().prepare('SELECT * FROM suggestions WHERE id = ?').get(id) as SuggestionRow) ?? null;
},
```

### Diff Display Component
```tsx
// src/components/diff-display.tsx
'use client';
import { useMemo } from 'react';
import { diffWordsWithSpace } from 'diff';

interface DiffDisplayProps {
  original: string;
  rewrite: string;
}

export function DiffDisplay({ original, rewrite }: DiffDisplayProps) {
  const changes = useMemo(() => diffWordsWithSpace(original, rewrite), [original, rewrite]);

  return (
    <div className="bg-muted rounded-md p-4">
      <p className="text-sm leading-relaxed">
        {changes.map((change, i) => {
          if (change.removed) {
            return (
              <span key={i} className="bg-red-500/15 text-red-600 dark:text-red-400 line-through decoration-red-400/50">
                {change.value}
              </span>
            );
          }
          if (change.added) {
            return (
              <span key={i} className="bg-green-500/15 text-green-600 dark:text-green-400 font-medium">
                {change.value}
              </span>
            );
          }
          return <span key={i}>{change.value}</span>;
        })}
      </p>
    </div>
  );
}
```

### Accept/Reject Button Pattern
```tsx
// Within suggestion-card.tsx
<div className="flex items-center gap-1">
  <button
    onClick={() => onStatusChange(suggestion.id, suggestion.status === 'accepted' ? 'pending' : 'accepted')}
    className={cn(
      'p-1.5 rounded-md transition-colors',
      suggestion.status === 'accepted' ? 'bg-green-500/20 text-green-600' : 'hover:bg-muted text-muted-foreground'
    )}
    aria-label={suggestion.status === 'accepted' ? 'Undo accept' : 'Accept suggestion'}
  >
    <Check className="h-4 w-4" />
  </button>
  <button
    onClick={() => onStatusChange(suggestion.id, suggestion.status === 'rejected' ? 'pending' : 'rejected')}
    className={cn(
      'p-1.5 rounded-md transition-colors',
      suggestion.status === 'rejected' ? 'bg-red-500/20 text-red-600' : 'hover:bg-muted text-muted-foreground'
    )}
    aria-label={suggestion.status === 'rejected' ? 'Undo reject' : 'Reject suggestion'}
  >
    <X className="h-4 w-4" />
  </button>
  <button
    onClick={() => onRegenerate(suggestion.id)}
    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
    aria-label="Regenerate suggestion"
  >
    <RefreshCw className="h-4 w-4" />
  </button>
</div>
```

### Script Preview with Applied Rewrites
```tsx
// src/components/script-preview.tsx
'use client';
import { useMemo } from 'react';
import type { SuggestionRow } from '@/lib/db';

interface ScriptPreviewProps {
  scriptText: string;
  suggestions: SuggestionRow[];
}

export function ScriptPreview({ scriptText, suggestions }: ScriptPreviewProps) {
  const previewText = useMemo(() => {
    const accepted = suggestions
      .filter(s => s.status === 'accepted')
      .map(s => ({ original: s.originalText, rewrite: s.rewriteText, index: scriptText.indexOf(s.originalText) }))
      .filter(s => s.index !== -1)
      .sort((a, b) => b.index - a.index); // reverse order to prevent offset drift

    let result = scriptText;
    for (const s of accepted) {
      result = result.slice(0, s.index) + s.rewrite + result.slice(s.index + s.original.length);
    }
    return result;
  }, [scriptText, suggestions]);

  return (
    <div className="border rounded-lg p-4 max-h-[600px] overflow-y-auto">
      <h3 className="text-sm font-semibold mb-3">Script Preview</h3>
      <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
        {previewText}
      </pre>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `diff-match-patch` (character-level, no types) | `diff` package v8 with `diffWordsWithSpace` | `diff` v8 released 2025 | Native word-level tokenization, TypeScript types, ESM support |
| Side-by-side diff panels | Inline tracked-changes (strikethrough + highlight) | Industry trend (Google Docs, Word) | More compact, better for prose (vs code diffs) |
| Full re-render on state change | `useMemo` derivation | React 18+ patterns | Efficient re-computation only when dependencies change |

**Deprecated/outdated:**
- `diff-match-patch` original npm package: last published 4+ years ago, no TypeScript types, character-level only
- `react-diff-viewer`: designed for code diffs (line-by-line), not suitable for prose word-level diffs

## Open Questions

1. **Duplicate originalText in script**
   - What we know: AI-generated `originalText` spans are usually multi-sentence and unique within a script. Short spans like single words could match multiple locations.
   - What's unclear: How often this occurs in practice with real scripts.
   - Recommendation: Use simple `indexOf` for v3.0. If duplicates cause issues, use `sceneHeading` as a proximity hint in a future iteration. The risk is low because suggestion prompts ask for "exact original text span" which tends to be paragraph-length.

2. **Script preview layout**
   - What we know: The revision page currently has a vertical stack layout (suggestions list + placeholder card for review/export).
   - What's unclear: Whether the preview should be side-by-side with suggestions or stacked below.
   - Recommendation: Use a two-column layout on large screens (suggestions left, preview right) and stacked on mobile. This gives the "tracked changes" feel the requirements describe. The placeholder card at the bottom already says "Review and export tools will appear here" -- the script preview replaces or sits alongside it.

3. **Regeneration loading state**
   - What we know: Single-suggestion regeneration takes 5-30 seconds depending on provider.
   - What's unclear: How to handle the UI during regeneration (disable card? spinner?).
   - Recommendation: Show a spinner on the regenerate button, disable accept/reject while regenerating, update the card in-place when the new rewrite arrives. Keep it simple -- no skeleton placeholder needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REVW-01 | Word-level diff computation returns correct Change[] | unit | `npx vitest run src/lib/__tests__/diff-utils.test.ts -x` | No -- Wave 0 |
| REVW-02 | Status PATCH updates DB and returns updated row | unit | `npx vitest run src/lib/__tests__/db-suggestions.test.ts -t "status" -x` | No -- Wave 0 |
| REVW-03 | Script preview applies accepted rewrites correctly | unit | `npx vitest run src/lib/__tests__/script-preview.test.ts -x` | No -- Wave 0 |
| REVW-04 | Regeneration endpoint returns new rewrite with reset status | integration | `npx vitest run src/app/api/projects/__tests__/suggestion-regenerate.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/diff-utils.test.ts` -- covers REVW-01 (word diff computation)
- [ ] `src/lib/__tests__/db-suggestions.test.ts` -- covers REVW-02 (status update CRUD)
- [ ] `src/lib/__tests__/script-preview.test.ts` -- covers REVW-03 (preview text derivation logic, extracted as pure function)
- [ ] `src/app/api/projects/__tests__/suggestion-regenerate.test.ts` -- covers REVW-04 (regeneration endpoint)
- [ ] Mock for `generateObject` -- needed for regeneration test (may already exist from Phase 16)

## Sources

### Primary (HIGH confidence)
- `src/lib/db.ts` -- current schema, SuggestionRow interface, CRUD methods, migration patterns
- `src/app/api/projects/[id]/suggestions/route.ts` -- existing suggestion API (GET, POST, DELETE), generateObject pattern, provider setup
- `src/components/suggestion-card.tsx` -- current card layout to extend with diff + buttons
- `src/components/suggestion-list.tsx` -- current list rendering to extend with status callbacks
- `src/app/revision/[projectId]/page.tsx` -- current page layout, state management, streaming logic
- `src/lib/suggestions.ts` -- weakness extraction, suggestion config (reuse for regeneration)
- `src/lib/ai/schemas/suggestion.ts` -- suggestion output schema (reuse for regeneration)
- [jsdiff GitHub](https://github.com/kpdecker/jsdiff) -- `diffWordsWithSpace` API, Change object format

### Secondary (MEDIUM confidence)
- [diff-match-patch-es](https://github.com/antfu/diff-match-patch-es) -- evaluated as alternative, character-level focus makes it less suitable than `diff` for word-level prose diffs
- [npm diff package](https://www.npmjs.com/package/diff) -- version 8.0.4, word-level diff with TypeScript support confirmed

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- `diff` package is well-established (30M+ weekly downloads), all other libraries already in use
- Architecture: HIGH -- all patterns directly extend existing codebase (same migration pattern, same API route pattern, same component pattern)
- Pitfalls: HIGH -- offset drift is well-understood; optimistic UI patterns are standard React; duplicate text matching is the only genuine uncertainty (LOW impact)
- Diff rendering: HIGH -- `diffWordsWithSpace` returns exactly the format needed for React rendering, verified via official docs

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable -- no fast-moving dependencies)
