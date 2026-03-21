# Architecture Patterns

**Domain:** Script improvement / tracked-changes feature for existing FilmIntern app
**Researched:** 2026-03-21
**Milestone:** v3.0 Script Improvement
**Confidence:** HIGH

## Current Architecture Summary

The existing app follows a straightforward pattern:

```
Upload (File -> Parser -> ParseResult{text, metadata})
  -> Store in DB as `uploadData` JSON (includes raw `text`)
  -> Analyze (streamText with Output.object -> structured analysis JSON)
  -> Store in DB as `analysisData` JSON
  -> Display in card-based workspace (evaluation cards per dimension)
  -> Export analysis report as PDF/DOCX
```

**Key facts established from code:**
- Original script text IS stored in DB via `uploadData.text` (confirmed in `workspace-context.tsx` line 116 and `db.ts` `uploadData` column)
- Analysis output IS stored as structured JSON in `analysisData` column
- Both are JSON-stringified TEXT columns in SQLite (not separate tables)
- Projects table is flat: one row per project, all data as JSON blobs
- The workspace context manages all state client-side, persisting via PUT to `/api/projects/[id]`
- Document workspace uses a tab-based layout: Report tab, optional Critic tab, generated document tabs
- Export uses Playwright Chromium for PDF, docx library for Word

## Recommended Architecture for v3.0 Script Improvement

### High-Level Flow

```
Completed Analysis (existing)
  -> "Generate Suggestions" button (new, user-triggered)
  -> POST /api/suggestions/generate (new API route)
     - Reads: uploadData.text + analysisData (weaknesses/recommendations)
     - AI generates array of Suggestion objects via streamText + Output.object
     - Streams suggestions back to client
  -> Store suggestions in DB (new `suggestions` column on projects table)
  -> Display in new "Script Review" tab in DocumentWorkspace
     - Each suggestion shown as inline diff card (original vs suggested)
     - Accept/reject buttons per suggestion
  -> "Apply Changes" merges accepted suggestions into revised text
  -> Export revised script via new /api/export/script route
```

### Component Boundaries

| Component | Responsibility | Communicates With | Status |
|-----------|---------------|-------------------|--------|
| `POST /api/suggestions/generate` | AI suggestion generation, streams structured suggestions | AI provider registry, DB | **NEW** |
| `POST /api/projects/[id]` | Persist suggestions (add `suggestions` field) | DB | **MODIFY** (add suggestions field) |
| `POST /api/export/script` | Export revised script as PDF/DOCX/FDX/TXT | Parsers, export libs | **NEW** |
| `db.ts` | Add `suggestions` column, add `revisedText` column | SQLite | **MODIFY** |
| `SuggestionReviewPanel` | Tracked-changes UI, accept/reject per suggestion | Workspace context | **NEW** |
| `DocumentWorkspace` | Add "Script Review" tab alongside existing tabs | SuggestionReviewPanel | **MODIFY** |
| `workspace-context.tsx` | Add suggestions state, revisedText state | All components | **MODIFY** |
| `SuggestionCard` | Single suggestion display: original vs suggested with diff | SuggestionReviewPanel | **NEW** |
| `ScriptDiffView` | Inline or side-by-side text diff rendering | SuggestionCard | **NEW** |
| `lib/suggestions/types.ts` | Suggestion TypeScript types and Zod schema | All suggestion code | **NEW** |
| `lib/suggestions/merge.ts` | Apply accepted suggestions to original text | Export route, UI | **NEW** |
| `lib/suggestions/prompt.ts` | Prompt engineering for suggestion generation | API route | **NEW** |
| `lib/ai/schemas/suggestions.ts` | Zod schema for AI-generated suggestions | API route | **NEW** |

### Data Flow

```
Client                          Server
  |                               |
  |-- POST /api/suggestions/generate -->
  |   { projectId }               |
  |                               |-- Read project from DB
  |                               |-- Extract uploadData.text + analysisData
  |                               |-- Build prompt: weaknesses + recommendations
  |                               |     + original script text
  |                               |-- streamText({ output: Output.object({
  |                               |     schema: suggestionsResponseSchema }) })
  |   <-- SSE stream of partial JSON --|
  |                               |
  |-- Parse progressive JSON      |
  |-- Update suggestions state    |
  |                               |
  |-- When done: POST /api/projects/[id] -->
  |   { suggestions: [...] }      |
  |                               |-- Save to DB
```

**Why server reads from DB (not client sends text):** The original text + analysis can be large. Sending them from client to server wastes bandwidth and risks payload limits. The server already has the project ID and can read directly from SQLite.

### Data Flow: Accept/Reject/Merge

```
1. User reviews suggestions in SuggestionReviewPanel
2. Clicks Accept or Reject on each SuggestionCard
3. Status updated in workspace context (local state)
4. Auto-save suggestions with statuses to DB (debounced PUT)
5. "Apply Changes" button:
   a. Filter to accepted suggestions
   b. Sort by position in original text (string search order)
   c. Apply replacements sequentially (last-to-first to preserve offsets)
   d. Store result as revisedText
   e. Save revisedText to DB
6. Export uses revisedText for script output
```

### Data Model: Suggestion Schema

```typescript
// lib/suggestions/types.ts

import { z } from 'zod';

export const suggestionSchema = z.object({
  id: z.string().describe('Unique suggestion ID'),
  // Location in original text
  originalText: z.string().describe('The exact text span being targeted for rewrite'),
  suggestedText: z.string().describe('The proposed replacement text'),
  // Context for the user
  rationale: z.string().describe('Why this change is suggested, referencing the analysis finding'),
  category: z.enum([
    'dialogue',
    'structure',
    'pacing',
    'character',
    'description',
    'theme',
    'clarity',
    'other',
  ]).describe('What aspect of the script this suggestion addresses'),
  severity: z.enum(['critical', 'important', 'minor']).describe('Priority level'),
  // Link back to analysis
  analysisSource: z.string().describe('Which analysis finding prompted this suggestion'),
  // Approximate location for ordering
  approximatePosition: z.enum(['early', 'middle', 'late']).describe('Where in the script'),
});

export const suggestionsResponseSchema = z.object({
  suggestions: z.array(suggestionSchema),
});

export type Suggestion = z.infer<typeof suggestionSchema>;

// Client-side enrichment (not from AI)
export interface SuggestionWithStatus extends Suggestion {
  status: 'pending' | 'accepted' | 'rejected';
}
```

**Why this schema:**
- `originalText` + `suggestedText` enables diff display without needing character offsets (which AI models produce unreliably)
- `rationale` links back to analysis findings so users understand WHY
- `category` enables filtering in the review UI
- `severity` enables sorting critical issues first
- `status` is client-side only (not generated by AI) -- tracked in workspace state
- String-based text matching (not character indices) because AI models cannot reliably produce exact character offsets in long documents

### Database Changes

```sql
-- Migration in db.ts (same pattern as existing migrations)
ALTER TABLE projects ADD COLUMN suggestions TEXT;
-- JSON-stringified array of SuggestionWithStatus objects

ALTER TABLE projects ADD COLUMN revisedText TEXT;
-- The merged text after accepting/rejecting suggestions, plain string
```

**Why columns on existing table (not a new table):** The app's architecture is JSON-blob-per-project. Every other data type (analysisData, reportDocument, generatedDocuments, criticAnalysis, uploadData) follows this pattern. Adding a suggestions table with foreign keys would be architecturally inconsistent and add complexity with zero benefit for a single-user app.

### UI Integration: Where the New Tab Lives

The existing `DocumentWorkspace` uses `<Tabs>` with these values:
- `{reportDocument.id}` -- Report tab (workspace cards)
- `__critic__` -- Industry Critic tab (optional)
- `{doc.id}` per generated document -- Outline, Treatment, Proposal tabs

**New tab: "Script Review"** inserted after Report, before Critic:

```
[Report] [Script Review] [Industry Critic] [Outline] [Treatment]
```

The Script Review tab contains:
1. A summary bar: "12 suggestions (3 critical, 5 important, 4 minor) -- 0 accepted, 0 rejected"
2. Filter/sort controls: by category, by severity, show accepted/rejected
3. A scrollable list of `SuggestionCard` components
4. Each card shows:
   - Category badge + severity indicator
   - Original text (red/strikethrough styling)
   - Suggested text (green/highlight styling)
   - Rationale text
   - Accept / Reject buttons
5. Bottom action bar: "Apply N Accepted Changes" button
6. After applying: "Export Revised Script" dropdown (PDF/DOCX/FDX/TXT)

**Why a tab (not a separate page):** The entire app workflow lives in the main page with workspace context. Adding a separate route would break the existing state management pattern and require duplicating project loading logic.

### Merge Algorithm

```typescript
// lib/suggestions/merge.ts

export function mergeAcceptedSuggestions(
  originalText: string,
  accepted: Suggestion[]
): string {
  // 1. Find each suggestion's originalText in the document
  // 2. Record the start index of each match
  // 3. Sort by start index DESCENDING (apply from end to start
  //    so earlier indices remain valid)
  // 4. Replace each span with suggestedText
  // 5. Return merged result

  let result = originalText;
  const located = accepted
    .map(s => ({
      ...s,
      index: result.indexOf(s.originalText),
    }))
    .filter(s => s.index !== -1)
    .sort((a, b) => b.index - a.index); // descending

  for (const s of located) {
    const before = result.slice(0, s.index);
    const after = result.slice(s.index + s.originalText.length);
    result = before + s.suggestedText + after;
  }

  return result;
}
```

**Why string search (not regex or char offsets):**
- AI models cannot produce reliable character offsets for long documents
- The original text spans come directly from the script, so `indexOf` is deterministic
- If a span appears multiple times, we take the first occurrence -- the AI prompt should instruct specificity (include surrounding context in originalText)
- Edge case: overlapping suggestions. The prompt instructs non-overlapping spans, and the UI should warn if two accepted suggestions target overlapping text

### Script Export Architecture

Revised script export is fundamentally different from analysis report export:

- **Analysis export** (existing): Renders a structured report document (TipTap JSON -> HTML -> PDF via Playwright)
- **Script export** (new): Takes plain text and outputs in screenplay/transcript format

| Format | Approach | Library |
|--------|----------|---------|
| TXT | Direct write -- just the text | None (Buffer.from) |
| PDF | Playwright Chromium with screenplay CSS formatting | Playwright (existing) |
| DOCX | docx library with screenplay paragraph styles | docx (existing) |
| FDX | Generate Final Draft XML from text | Custom XML builder (new, simple) |

**FDX export** is the only genuinely new export format. FDX is XML:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
    <Paragraph Type="Action"><Text>INT. HOUSE - DAY</Text></Paragraph>
    <Paragraph Type="Dialogue"><Text>Hello world</Text></Paragraph>
  </Content>
</FinalDraft>
```

The FDX parser already exists for import (`fdx-parser.ts`). The export is the inverse -- but only needed for screenplay types (narrative, tv-episodic), not documentary/corporate transcripts. For transcripts, TXT/PDF/DOCX suffice.

### Prompt Engineering Strategy

The suggestion generation prompt needs to:

1. Receive the full original script text
2. Receive the analysis weaknesses/recommendations extracted from analysisData
3. Generate specific, locatable text replacements

**Critical prompt design decisions:**
- Instruct the AI to quote EXACT text spans (not paraphrased) for `originalText`
- Limit to 10-20 suggestions per run (quality over quantity)
- Order by severity
- Each suggestion must target a non-overlapping span
- `originalText` should be long enough to be unique (minimum a full sentence)

The prompt should vary by project type:
- **Narrative/TV-Episodic:** Focus on dialogue, scene descriptions, structure
- **Documentary:** Focus on interview question flow, narration text, segment transitions
- **Corporate:** Focus on messaging clarity, soundbite sharpening, narrative coherence

### New Files (Complete List)

```
src/
  lib/
    suggestions/
      types.ts           -- Suggestion, SuggestionWithStatus types + Zod schemas
      merge.ts           -- mergeAcceptedSuggestions() function
      prompt.ts          -- Per-project-type suggestion prompts
  app/
    api/
      suggestions/
        generate/
          route.ts       -- POST handler: stream suggestion generation
      export/
        script/
          route.ts       -- POST handler: export revised script
  components/
    suggestions/
      suggestion-review-panel.tsx  -- Main container for Script Review tab
      suggestion-card.tsx          -- Individual suggestion with diff + accept/reject
      suggestion-summary-bar.tsx   -- Stats bar (counts by status/severity)
      suggestion-filters.tsx       -- Category/severity filter controls
```

### Modified Files (Complete List)

```
src/
  lib/
    db.ts                          -- Add suggestions + revisedText columns
  contexts/
    workspace-context.tsx          -- Add suggestions, revisedText state + save functions
  components/
    document-workspace.tsx         -- Add "Script Review" tab + "Generate Suggestions" button
  lib/
    documents/
      types.ts                     -- Add ExportFormat 'fdx' | 'txt' (extend union)
  app/
    api/
      projects/
        [id]/
          route.ts                 -- Add suggestions + revisedText to PUT handler
```

## Patterns to Follow

### Pattern 1: Match Existing Streaming Pattern
**What:** Use the same progressive JSON parsing pattern as the existing analysis flow
**When:** Suggestion generation streaming
**Why:** The app already has a proven pattern for `streamText` + `Output.object` -> progressive `JSON.parse`. Reuse it exactly rather than introducing a new streaming approach.

```typescript
// Same pattern as page.tsx handleAnalyze()
const response = await fetch('/api/suggestions/generate', { ... });
const reader = response.body?.getReader();
let accumulated = '';
while (reader) {
  const { done, value } = await reader.read();
  if (done) break;
  accumulated += decoder.decode(value, { stream: true });
  try {
    const partial = JSON.parse(accumulated);
    setSuggestions(partial.suggestions?.map(s => ({ ...s, status: 'pending' })));
  } catch { /* incomplete JSON */ }
}
```

### Pattern 2: Match Existing DB Column Pattern
**What:** Store suggestions as JSON-stringified TEXT column on projects table
**When:** Persisting suggestions
**Why:** Every other piece of project data follows this pattern. Architectural consistency matters more than theoretical normalization benefits in a single-user SQLite app.

### Pattern 3: Match Existing Tab Pattern
**What:** Add Script Review as a tab in DocumentWorkspace, using the same Tabs/TabsList/TabsTrigger/TabsContent structure
**When:** Building the review UI
**Why:** The existing tab infrastructure handles active state, loading indicators, and layout. No reason to reinvent.

### Pattern 4: Server-Side Project Data Access
**What:** The suggestion generation API route reads the project from DB by ID rather than receiving text from the client
**When:** Triggering suggestion generation
**Why:** Avoids sending potentially 100KB+ of script text + analysis in the request body. The server already has direct SQLite access.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Character Offset-Based Suggestions
**What:** Having the AI output `{ startChar: 1234, endChar: 1456, replacement: "..." }`
**Why bad:** LLMs cannot reliably count characters in long documents. Off-by-one or off-by-hundreds errors would make suggestions unmatchable.
**Instead:** Use exact text span matching. The AI quotes the original text verbatim, and we use string search to locate it.

### Anti-Pattern 2: Real-Time Collaborative Diff (OT/CRDT)
**What:** Implementing operational transforms or CRDTs for the tracked-changes view
**Why bad:** This is a single-user personal tool. OT/CRDT adds massive complexity for zero benefit.
**Instead:** Simple accept/reject per suggestion with sequential merge. No concurrent editing.

### Anti-Pattern 3: Separate Suggestions Table with Foreign Keys
**What:** Creating a `suggestions` table with `project_id` FK and one row per suggestion
**Why bad:** Architecturally inconsistent with the existing all-JSON-blobs-on-projects approach. Adds migration complexity, join queries, and transaction concerns for a single-user app.
**Instead:** JSON blob column, same as every other data type.

### Anti-Pattern 4: Inline Script Editor
**What:** Building a full rich-text editor for the script where users manually edit alongside AI suggestions
**Why bad:** PROJECT.md explicitly lists "AI rewriting / script editing" as out of scope. The goal is review+accept/reject, not manual editing.
**Instead:** Read-only diff view with accept/reject buttons. The revised text is computed, not manually edited.

### Anti-Pattern 5: Generating Suggestions During Analysis
**What:** Bundling suggestion generation into the analysis streaming call
**Why bad:** Analysis is already a complex, expensive AI call. Adding suggestions would make it slower, more fragile, and impossible to re-run suggestions without re-running analysis.
**Instead:** Separate, user-triggered "Generate Suggestions" action after analysis completes.

## Build Order (Suggested Phases)

### Phase 1: Data Foundation + Suggestion Generation
**Build:** types, schema, DB migration, API route, prompt engineering
**Why first:** Everything else depends on having suggestions data. This can be tested independently via API calls.
**Delivers:** `POST /api/suggestions/generate` that streams suggestions for a project

### Phase 2: Suggestion Review UI
**Build:** SuggestionCard, SuggestionReviewPanel, DocumentWorkspace tab integration, workspace context additions
**Why second:** Depends on Phase 1 data model. This is the core UX of the feature.
**Delivers:** Users can see and accept/reject suggestions in the UI

### Phase 3: Merge + Revised Text
**Build:** merge.ts algorithm, "Apply Changes" button, revisedText storage
**Why third:** Depends on Phase 2 for accepted/rejected status. Relatively small scope.
**Delivers:** Users can produce a revised script from accepted suggestions

### Phase 4: Script Export
**Build:** Export API route for revised script, FDX export builder, PDF/DOCX script formatting, TXT export
**Why last:** Depends on Phase 3 for revised text. Can reuse existing Playwright/docx infrastructure.
**Delivers:** Full export of revised script in all 4 formats

**Phase ordering rationale:** Each phase produces a usable increment. Phase 1 can be validated via curl. Phase 2 adds visual validation. Phase 3 completes the core loop. Phase 4 is output formatting that can be tackled format-by-format.

## Scalability Considerations

| Concern | Current (single user) | If text gets very large (100+ pages) |
|---------|----------------------|--------------------------------------|
| Suggestion generation time | 30-60s for typical script | May need chunked generation for very long texts |
| DB storage | JSON blob is fine | JSON blob is still fine -- SQLite handles multi-MB TEXT columns |
| Merge performance | Instant for 10-20 suggestions | Still instant -- string replacement is O(n*m) but n and m are small |
| Context window limits | Most scripts fit in 128K context | Very long scripts may need excerpt-based suggestion generation |

The main scalability concern is **AI context window limits**. A 120-page screenplay is ~30K words / ~40K tokens. With analysis data added, this approaches the context window of smaller models. The prompt should be designed to:
1. Include the full original text
2. Include only the weakness/recommendation portions of the analysis (not the full analysis)
3. This keeps total prompt size manageable for 128K-200K context window models

## Sources

- Codebase analysis: `src/lib/db.ts`, `src/app/api/analyze/route.ts`, `src/app/page.tsx`, `src/contexts/workspace-context.tsx`, `src/components/document-workspace.tsx`
- Existing patterns: JSON blob storage, progressive JSON streaming, tab-based workspace
- Architecture decisions derived from existing codebase patterns (HIGH confidence -- based on direct code reading)

---
*Architecture research for: FilmIntern v3.0 Script Improvement*
*Researched: 2026-03-21*
