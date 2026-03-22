# Phase 16: Data Foundation + Suggestion Generation - Research

**Researched:** 2026-03-22
**Domain:** SQLite schema migration, AI streaming API (Vercel AI SDK), Next.js API routes, per-type prompt engineering
**Confidence:** HIGH

## Summary

This phase adds a `suggestions` table to SQLite, captures raw FDX XML at upload time, builds a suggestion generation API route that makes N parallel AI calls (one per weakness), and replaces the placeholder card on the revision page with a generation panel + streaming suggestion list.

The existing codebase has strong, well-established patterns for every technical concern in this phase: try/catch `ALTER TABLE` migrations in `src/lib/db.ts`, the `streamText` + `Output.object` AI SDK pattern in `src/app/api/analyze/route.ts`, per-type config maps with separate prompt/schema files, and progressive JSON parsing on the client via `getReader()`. The main engineering challenge is orchestrating N independent AI calls (one per weakness) and streaming their results to the client as they complete, rather than the single-stream pattern used by the analysis route.

**Primary recommendation:** Follow existing patterns exactly -- new `suggestions` table via try/catch migration, `generateObject` (not `streamText`) for each individual suggestion since each is a small structured object, and NDJSON streaming from the API route to push one complete suggestion per line as each AI call resolves.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Each suggestion carries: scene heading, speaker/character name (if applicable), exact original text span being rewritten, proposed rewrite text, and a weakness reference (`{ category: string, label: string }`)
- No ranking or priority field -- generation order is sufficient for display
- Display order = insertion order from the generation run
- Own `suggestions` table (with `projectId` foreign key) is preferred over a JSON column because Phase 17 requires per-suggestion accept/reject state
- Raw FDX XML is saved at upload time (not at suggestion generation time)
- Stored in a new nullable `fdxSource TEXT` column on the `projects` table
- Only populated for `.fdx` uploads; null for all other file types
- Migration pattern: try/catch `ALTER TABLE projects ADD COLUMN fdxSource TEXT`
- Revision page has a number input (default 10) and a "Generate Suggestions" button
- Suggestions stream in progressively: one card appears per suggestion as each individual AI call completes
- When the page loads with existing suggestions, those are displayed immediately; a "Regenerate" option is available but does not auto-run
- Regeneration replaces all existing suggestions for the project (clear + insert, not accumulate)
- The full `analysisData` JSON is passed to the suggestion prompt (not just extracted weaknesses)
- Per-project-type suggestion prompts -- one prompt file per type (narrative, tv-episodic, documentary, corporate)
- Each suggestion AI call targets one weakness; the count parameter drives how many calls are made

### Claude's Discretion
- Whether suggestions table uses UUID or the existing `generateId()` pattern
- Exact API route path for suggestion generation
- Error handling for partial generation failures (some suggestions succeed, some fail)
- Max allowed count value (prevent runaway API costs)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SUGG-01 | User can trigger AI suggestion generation from a completed analysis | Generation panel UI with "Generate Suggestions" button; API route at `/api/projects/[id]/suggestions`; existing revision page shell has placeholder card to replace |
| SUGG-02 | Suggestions target specific weaknesses flagged in the analysis (not generic rewrites) | Per-type prompt files receive full analysisData; weakness extraction logic maps schema-specific weakness fields to targetable items; weakness reference stored as `{ category, label }` |
| SUGG-03 | Suggestions stream progressively as they're generated | NDJSON streaming from API route; N parallel `generateObject` calls with results pushed to response stream as they resolve; client reads via `getReader()` progressive parse pattern |
| SUGG-04 | User can set how many suggestions to generate (default ~10) | Number input (min 1, max 25) on generation panel; count drives how many AI calls are dispatched; max cap prevents runaway costs |
| SUGG-05 | Suggestion generation works for all 4 project types | Four prompt files: `narrative-suggestion.ts`, `tv-episodic-suggestion.ts`, `documentary-suggestion.ts`, `corporate-suggestion.ts`; `suggestionConfig` map mirrors existing `analysisConfig` pattern |
| SUGG-06 | Generated suggestions are saved to the database linked to the analysis | `suggestions` table with `projectId` FK; each suggestion inserted as it completes; `GET /api/projects/[id]/suggestions` returns persisted suggestions on page reload |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-sqlite3 | ^12.8.0 | SQLite database -- suggestions table, fdxSource column | Already in use; synchronous API ideal for server-side Next.js |
| ai (Vercel AI SDK) | ^6.0.116 | `generateObject` for structured suggestion output | Already in use for analysis; `generateObject` returns complete structured object per call |
| zod | ^4.3.6 | Suggestion output schema validation | Already in use for analysis schemas |
| next | 16.1.6 | API routes, app router | Already the framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn input | (registry) | Number input for suggestion count | New shadcn component needed for the generation panel |
| shadcn alert-dialog | (registry) | Regeneration confirmation dialog | New shadcn component for destructive regenerate action |
| lucide-react | ^0.577.0 | Loader2 spinner icon | Already available, used during generation state |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `generateObject` per suggestion | `streamText` with bulk prompt | Bulk would be cheaper on tokens but CONTEXT.md locks "one AI call per weakness" for progressive UX |
| NDJSON streaming | Server-Sent Events | SSE adds complexity; NDJSON is simpler and consistent with the existing `getReader()` pattern |
| Separate suggestions table | JSON column on projects | JSON column would make Phase 17 per-suggestion state management unwieldy (locked decision) |

**Installation:**
```bash
npx shadcn@latest add input alert-dialog
```

No new npm dependencies required. All libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── db.ts                              # Add suggestions table migration, CRUD methods, fdxSource migration
│   ├── ai/
│   │   ├── prompts/
│   │   │   ├── narrative-suggestion.ts     # NEW: narrative suggestion prompt
│   │   │   ├── tv-episodic-suggestion.ts   # NEW: tv-episodic suggestion prompt
│   │   │   ├── documentary-suggestion.ts   # NEW: documentary suggestion prompt
│   │   │   └── corporate-suggestion.ts     # NEW: corporate suggestion prompt
│   │   └── schemas/
│   │       └── suggestion.ts              # NEW: shared suggestion output schema (same for all types)
│   └── suggestions.ts                     # NEW: weakness extraction + orchestration logic
├── app/
│   ├── api/
│   │   └── projects/
│   │       └── [id]/
│   │           └── suggestions/
│   │               └── route.ts           # NEW: POST (generate), GET (list), DELETE (clear)
│   └── revision/
│       └── [projectId]/
│           └── page.tsx                   # MODIFY: replace placeholder with generation panel + list
├── components/
│   ├── suggestion-generation-panel.tsx     # NEW: count input + generate/regenerate buttons
│   ├── suggestion-card.tsx                # NEW: individual suggestion display
│   └── suggestion-list.tsx                # NEW: streaming list container
```

### Pattern 1: Database Migration (try/catch ALTER TABLE)
**What:** Add columns and tables using the existing idempotent migration pattern
**When to use:** Every schema change in this project
**Example:**
```typescript
// Source: src/lib/db.ts (existing pattern, lines 27-29)
// fdxSource column on projects
try { _db.exec('ALTER TABLE projects ADD COLUMN fdxSource TEXT'); } catch { /* already exists */ }

// suggestions table
_db.exec(`
  CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    orderIndex INTEGER NOT NULL,
    sceneHeading TEXT,
    characterName TEXT,
    originalText TEXT NOT NULL,
    rewriteText TEXT NOT NULL,
    weaknessCategory TEXT NOT NULL,
    weaknessLabel TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  )
`);
```

### Pattern 2: Per-Type Config Map (mirrors analysisConfig)
**What:** A `suggestionConfig` record mapping project type to prompt string
**When to use:** When dispatching suggestion generation for any project type
**Example:**
```typescript
// Source: mirrors src/app/api/analyze/route.ts lines 14-19
const suggestionConfig: Record<string, { prompt: string }> = {
  narrative: { prompt: narrativeSuggestionPrompt },
  'tv-episodic': { prompt: tvEpisodicSuggestionPrompt },
  documentary: { prompt: documentarySuggestionPrompt },
  corporate: { prompt: corporateSuggestionPrompt },
};
```

### Pattern 3: NDJSON Streaming for Progressive Suggestions
**What:** API route streams one JSON object per line as each AI call completes
**When to use:** Suggestion generation endpoint
**Example:**
```typescript
// Server side: push each suggestion as NDJSON
const stream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();
    const promises = weaknesses.map(async (weakness, i) => {
      const result = await generateObject({ /* ... */ });
      const suggestion = { id: generateId(), ...result.object, orderIndex: i };
      // Persist to DB immediately
      db.insertSuggestion(suggestion);
      // Stream to client
      controller.enqueue(encoder.encode(JSON.stringify(suggestion) + '\n'));
    });
    await Promise.allSettled(promises);
    controller.close();
  }
});
return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } });
```

```typescript
// Client side: read NDJSON line by line
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let buffer = '';
while (reader) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // keep incomplete line
  for (const line of lines) {
    if (line.trim()) {
      const suggestion = JSON.parse(line);
      setSuggestions(prev => [...prev, suggestion]);
    }
  }
}
```

### Pattern 4: Weakness Extraction (per-type)
**What:** Extract targetable weaknesses from analysisData for each project type
**When to use:** Before dispatching suggestion AI calls
**Example:**
```typescript
// Each type has different weakness locations in the schema
function extractWeaknesses(analysisData: Record<string, unknown>, projectType: string): WeaknessTarget[] {
  switch (projectType) {
    case 'narrative': {
      const data = analysisData as NarrativeAnalysis;
      const weaknesses: WeaknessTarget[] = [];
      // Structural weaknesses
      for (const w of data.storyStructure?.structuralWeaknesses ?? []) {
        weaknesses.push({ category: 'storyStructure', label: `Structural weakness: ${w}` });
      }
      // Character weaknesses
      for (const char of data.scriptCoverage?.characters ?? []) {
        for (const w of char.weaknesses ?? []) {
          weaknesses.push({ category: 'character', label: `${char.name}: ${w}` });
        }
      }
      // Dialogue weaknesses
      for (const w of data.scriptCoverage?.dialogueQuality?.weaknesses ?? []) {
        weaknesses.push({ category: 'dialogue', label: `Dialogue: ${w}` });
      }
      // Overall weaknesses
      for (const w of data.scriptCoverage?.overallWeaknesses ?? []) {
        weaknesses.push({ category: 'overall', label: w });
      }
      // Development recommendations
      for (const r of data.developmentRecommendations ?? []) {
        weaknesses.push({ category: 'recommendation', label: r });
      }
      return weaknesses;
    }
    // ... similar for other types
  }
}
```

### Anti-Patterns to Avoid
- **Bulk generation in one AI call:** The locked decision requires one AI call per weakness. Do not try to generate all suggestions in a single prompt -- it defeats the progressive streaming UX.
- **Storing suggestions as JSON on the projects table:** Phase 17 needs per-suggestion accept/reject state. A normalized table is required.
- **Using `streamText` for individual suggestions:** Each suggestion is a small structured object. `generateObject` is the right tool -- it returns a complete, validated object. `streamText` with `Output.object` is for large streaming objects like the analysis.
- **Sequential AI calls:** The calls are independent. Use `Promise.allSettled` (not sequential awaits) so suggestions arrive as fast as possible.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured AI output | Manual JSON parsing from text | `generateObject` from Vercel AI SDK | Schema validation, type safety, retries built in |
| Suggestion output schema | Per-type schema | Single shared Zod schema for all types | The suggestion shape is the same regardless of project type; only the prompt varies |
| NDJSON parsing | Custom streaming protocol | Line-delimited JSON with `\n` separator | Industry standard, trivial to parse, no framing overhead |
| Confirmation dialog | Custom modal | shadcn AlertDialog | Accessible, focus-trapped, keyboard-navigable out of the box |
| Number input validation | Custom validation | HTML `type="number"` with `min`/`max` + server-side clamp | Browser-native UX, server enforces bounds |

**Key insight:** This phase is almost entirely "glue" -- connecting existing patterns (AI SDK, SQLite, streaming) in a new configuration. The only genuinely new logic is weakness extraction from per-type analysis schemas and the suggestion prompt engineering.

## Common Pitfalls

### Pitfall 1: Race Condition in Parallel Writes
**What goes wrong:** Multiple `generateObject` calls resolve near-simultaneously and try to INSERT into SQLite concurrently.
**Why it happens:** better-sqlite3 is synchronous and single-threaded per connection, but Node.js async code can interleave between awaits.
**How to avoid:** better-sqlite3's synchronous API actually serializes writes naturally within the same process. No explicit locking needed. However, do NOT use a transaction wrapping all inserts -- insert each suggestion individually as it arrives so it streams to the client immediately.
**Warning signs:** Suggestions not appearing in the database despite appearing in the stream.

### Pitfall 2: NDJSON Buffering on the Client
**What goes wrong:** Chunks from `getReader()` don't align with JSON line boundaries, causing parse errors.
**Why it happens:** TCP/HTTP chunking is arbitrary -- a chunk may contain half a line or multiple lines.
**How to avoid:** Buffer incoming data, split on `\n`, keep the last incomplete segment in the buffer for the next read cycle (shown in Pattern 3 above).
**Warning signs:** Intermittent `JSON.parse` errors on the client.

### Pitfall 3: Weakness Count vs Requested Count Mismatch
**What goes wrong:** User requests 10 suggestions but the analysis only contains 4 weaknesses, or 30 weaknesses.
**Why it happens:** The number of extractable weaknesses varies by analysis quality and project type.
**How to avoid:** Extract all weaknesses, then slice to `min(requestedCount, weaknesses.length)`. If fewer weaknesses than requested, generate what's available and inform the user. If more, select the first N (or a diverse sample across categories).
**Warning signs:** Generating 3 suggestions when user asked for 10, with no explanation.

### Pitfall 4: FDX Source Capture Timing
**What goes wrong:** FDX raw XML is not available when needed for Phase 18 export.
**Why it happens:** The upload route (`/api/upload`) parses the file and returns extracted text but discards the raw XML. The raw source must be captured and stored separately.
**How to avoid:** In the upload route, when the file extension is `.fdx`, read the raw buffer as UTF-8 string and include it in the response as `fdxSource`. The client-side upload flow then saves it via the project update API.
**Warning signs:** `fdxSource` column is always null for FDX uploads.

### Pitfall 5: generateObject Timeout for Slow Providers
**What goes wrong:** Individual suggestion AI calls time out, especially with Ollama or slower models.
**Why it happens:** Next.js API routes have a default timeout (`maxDuration`). With N parallel calls, the total wall-clock time can exceed it.
**How to avoid:** Set `maxDuration = 300` (5 minutes) on the suggestion route, matching or exceeding the analysis route's 60s per single call. Each individual `generateObject` call should complete in under 30s for cloud providers, but Ollama may be slower.
**Warning signs:** 504 Gateway Timeout or partial results.

### Pitfall 6: Prompt Too Large with Full analysisData
**What goes wrong:** Passing the entire analysisData JSON (which can be very large for narrative scripts) into each suggestion prompt exceeds context limits.
**Why it happens:** A full narrative analysis can be 10-20KB of JSON. Multiplied by N calls, this is a lot of input tokens.
**How to avoid:** The full analysisData is included per the locked decision, but the prompt should be structured to include it efficiently: include it once as context, with the specific weakness clearly highlighted. Consider using a condensed representation if token limits are hit. For Ollama with small context windows, this is the primary risk.
**Warning signs:** AI provider returns "context length exceeded" errors.

## Code Examples

### Suggestion Output Schema (shared across all types)
```typescript
// src/lib/ai/schemas/suggestion.ts
import { z } from 'zod';

export const suggestionSchema = z.object({
  sceneHeading: z.string().nullable().describe('Scene heading where the weakness occurs, or null if not scene-specific'),
  characterName: z.string().nullable().describe('Character name if the suggestion relates to a specific character'),
  originalText: z.string().describe('Exact original text span from the script that should be rewritten'),
  rewriteText: z.string().describe('The proposed rewrite replacing the original text'),
});

export type SuggestionOutput = z.infer<typeof suggestionSchema>;
```

### Suggestion Database Row Interface
```typescript
// Addition to src/lib/db.ts
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
  createdAt: string;
}
```

### Suggestion Generation API Route Structure
```typescript
// src/app/api/projects/[id]/suggestions/route.ts
// POST: generate suggestions (NDJSON stream response)
// GET: list existing suggestions for project
// DELETE: clear all suggestions for project (used before regeneration)

export const maxDuration = 300; // 5 minutes for N parallel AI calls

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { count = 10 } = await req.json();
  const clampedCount = Math.min(Math.max(1, count), 25); // enforce bounds

  const project = db.getProject(id);
  if (!project?.analysisData) {
    return Response.json({ error: 'No analysis data' }, { status: 400 });
  }

  const analysisData = JSON.parse(project.analysisData);
  const weaknesses = extractWeaknesses(analysisData, project.projectType);
  const targets = weaknesses.slice(0, clampedCount);

  // Clear existing suggestions before generating new ones
  db.deleteSuggestionsForProject(id);

  // Stream NDJSON response with one suggestion per line
  // ... (see Pattern 3 above)
}
```

### FDX Source Capture in Upload Flow
```typescript
// Modification to upload flow -- the raw buffer is available in /api/upload
// When ext === '.fdx', include raw XML in the response:
if (ext === '.fdx') {
  const rawXml = buffer.toString('utf-8');
  result.fdxSource = rawXml;
}
// Client saves fdxSource alongside uploadData when creating/updating the project
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `streamText` with `Output.object` for structured data | `generateObject` for small structured objects | AI SDK v4+ | `generateObject` is simpler, validates output, retries on schema mismatch |
| JSON column for related records | Normalized table with FK | (project decision) | Enables per-row state management in Phase 17 |
| Single bulk AI call for all suggestions | One call per weakness | (project decision) | Progressive UX, better error isolation, parallelizable |

**Deprecated/outdated:**
- None relevant. The Vercel AI SDK v6 APIs (`generateObject`, `streamText`) are current and stable.

## Open Questions

1. **Weakness diversity when count < total weaknesses**
   - What we know: Extraction may yield 20+ weaknesses for a detailed narrative analysis. User might request only 5.
   - What's unclear: Should we prioritize certain weakness categories over others, or just take the first N?
   - Recommendation: Use insertion order (first N). The analysis already orders weaknesses by significance within each section. This is simplest and aligned with the "no ranking field" decision.

2. **Ollama context window limits**
   - What we know: Full analysisData can be large. Ollama models often have 4K-8K context windows.
   - What's unclear: Whether the full analysis + prompt + script text will fit in small context windows.
   - Recommendation: Include analysisData but NOT the full script text in suggestion prompts. The analysisData contains all the context needed (it includes quotes and references). This keeps token usage manageable.

3. **Concurrent generateObject call limit**
   - What we know: Cloud providers (Anthropic, OpenAI) have rate limits. 10-25 parallel calls could hit them.
   - What's unclear: Exact rate limits vary by plan and provider.
   - Recommendation: Use `Promise.allSettled` with a concurrency limiter (simple semaphore pattern -- 3-5 concurrent calls). This prevents rate limiting while still being fast. No external dependency needed.

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
| SUGG-01 | Generate suggestions API returns NDJSON stream | integration | `npx vitest run src/app/api/projects/__tests__/suggestions-route.test.ts -t "generates suggestions" -x` | No -- Wave 0 |
| SUGG-02 | Weakness extraction returns typed targets from analysis | unit | `npx vitest run src/lib/__tests__/suggestions.test.ts -t "extracts weaknesses" -x` | No -- Wave 0 |
| SUGG-03 | Streaming returns suggestions progressively | integration | `npx vitest run src/app/api/projects/__tests__/suggestions-route.test.ts -t "streams" -x` | No -- Wave 0 |
| SUGG-04 | Count parameter controls number of suggestions | unit | `npx vitest run src/lib/__tests__/suggestions.test.ts -t "respects count" -x` | No -- Wave 0 |
| SUGG-05 | All 4 project types have suggestion config | unit | `npx vitest run src/lib/__tests__/suggestions.test.ts -t "all project types" -x` | No -- Wave 0 |
| SUGG-06 | Suggestions persist to database and load on GET | integration | `npx vitest run src/app/api/projects/__tests__/suggestions-route.test.ts -t "persists" -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/suggestions.test.ts` -- covers SUGG-02, SUGG-04, SUGG-05 (weakness extraction, count logic, type coverage)
- [ ] `src/app/api/projects/__tests__/suggestions-route.test.ts` -- covers SUGG-01, SUGG-03, SUGG-06 (API route, streaming, persistence)
- [ ] Mock for `generateObject` -- needed to test suggestion generation without real AI calls

## Sources

### Primary (HIGH confidence)
- `src/lib/db.ts` -- existing migration pattern, `generateId()`, `ProjectRow` interface
- `src/app/api/analyze/route.ts` -- existing streaming AI call pattern, `analysisConfig` map, error handling
- `src/lib/ai/schemas/narrative.ts` -- weakness field locations in narrative analysis
- `src/lib/ai/schemas/documentary.ts` -- weakness field locations in documentary analysis
- `src/lib/ai/schemas/corporate.ts` -- weakness field locations in corporate analysis
- `src/lib/ai/schemas/tv-episodic.ts` -- weakness field locations in tv-episodic analysis
- `src/app/revision/[projectId]/page.tsx` -- placeholder card structure, existing data loading pattern
- `src/app/api/upload/route.ts` -- upload flow where FDX source must be captured
- `src/lib/parsers/fdx-parser.ts` -- FDX parsing, buffer available for raw XML capture
- `src/lib/ai/provider-registry.ts` -- provider setup, reusable for suggestion calls
- `16-UI-SPEC.md` -- visual contract for generation panel, suggestion cards, all states
- `16-CONTEXT.md` -- locked decisions constraining implementation

### Secondary (MEDIUM confidence)
- Vercel AI SDK `generateObject` docs -- structured output with schema validation (verified via existing codebase usage of `streamText` with `Output.object`)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, no new dependencies
- Architecture: HIGH -- all patterns directly mirror existing codebase patterns
- Pitfalls: HIGH -- derived from reading actual code and understanding the specific streaming/concurrency concerns
- Weakness extraction: MEDIUM -- schema field mapping requires careful per-type logic; exact field paths verified from schema files but real analysis data may have optional/null fields

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- no fast-moving dependencies)
