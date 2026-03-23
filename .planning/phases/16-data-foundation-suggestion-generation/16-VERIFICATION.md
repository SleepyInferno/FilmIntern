---
phase: 16-data-foundation-suggestion-generation
verified: 2026-03-23T10:45:00Z
status: human_needed
score: 10/10 must-haves verified
re_verification: false
human_verification:
  - test: "Generate suggestions end-to-end"
    expected: "Click Generate Suggestions on a project with completed analysis. Cards should stream in one by one with the streaming indicator showing 'Generating suggestion N of M...'"
    why_human: "Requires live AI provider, streaming NDJSON consumption, and UI rendering — cannot verify programmatically"
  - test: "Suggestions persist across page refresh"
    expected: "After generating suggestions, refresh the revision page. Existing suggestions should appear immediately without re-generating. The list should render ABOVE the generation panel (suggestions-first layout)."
    why_human: "Requires browser rendering and SQLite persistence verification in a live environment"
  - test: "Regeneration confirmation dialog"
    expected: "With existing suggestions, click 'Regenerate Suggestions'. An AlertDialog should appear with 'Regenerate all suggestions?' title. Clicking 'Replace Suggestions' should clear and regenerate. Clicking 'Keep Current Suggestions' should dismiss without action."
    why_human: "Requires browser interaction with AlertDialog component"
  - test: "Critic analysis source toggle (post-checkpoint enhancement)"
    expected: "On a project with both standard and critic analysis, the generation panel should show a Standard Analysis / Harsh Critic toggle. Selecting 'Harsh Critic' and generating should produce suggestions from the critic analysis text."
    why_human: "Requires live critic analysis data and AI generation to verify routing to criticPrompt"
---

# Phase 16: Data Foundation + Suggestion Generation Verification Report

**Phase Goal:** Build the complete suggestion generation feature — data layer, AI logic, streaming API, and revision UI — so users can generate AI-powered script improvement suggestions from their analysis results.
**Verified:** 2026-03-23T10:45:00Z
**Status:** human_needed (all automated checks passed)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Suggestions table exists in SQLite with all required columns | VERIFIED | `src/lib/db.ts` lines 34-48: `CREATE TABLE IF NOT EXISTS suggestions` with all 10 required columns (id, projectId, orderIndex, sceneHeading, characterName, originalText, rewriteText, weaknessCategory, weaknessLabel, createdAt) + FK cascade |
| 2 | FDX raw XML is captured at upload time and persisted to fdxSource column | VERIFIED | Upload route (line 37-39): captures `buffer.toString('utf-8')` for `.fdx` files. page.tsx (line 144): spreads fdxSource into PUT body. projects/[id]/route.ts (line 22): accepts fdxSource in PUT handler. db.ts (line 118): updateProject writes fdxSource. |
| 3 | Weakness extraction returns typed targets from all 4 analysis schema types | VERIFIED | `src/lib/suggestions.ts`: extractWeaknesses switch covers narrative, tv-episodic, documentary, corporate with correct field paths. extractCriticWeaknesses added as enhancement for critic analysis. |
| 4 | Each project type has a dedicated suggestion prompt | VERIFIED | All 4 prompt files exist and export substantive string constants. Each was enhanced post-checkpoint with an additional criticPrompt variant. |
| 5 | Suggestion CRUD methods work correctly (insert, list, delete) | VERIFIED | `src/lib/db.ts` lines 129-141: insertSuggestion, listSuggestions (ORDER BY orderIndex ASC), deleteSuggestionsForProject — all implemented with prepared statements |
| 6 | Wave 0 test stubs exist for suggestion DB, weakness extraction, and API route behaviors | VERIFIED | 14 todos in `src/lib/__tests__/suggestions.test.ts`, 9 todos in `src/app/api/projects/__tests__/suggestions-route.test.ts` — 23 total, all `it.todo()` (not false-green) |
| 7 | User can click Generate Suggestions button and see suggestion cards stream in one by one | HUMAN NEEDED | Route streams NDJSON, page reads via getReader() with buffer pattern — wiring is correct but live behavior requires human testing |
| 8 | Suggestions persist to database and reload on page refresh | HUMAN NEEDED | GET handler and useEffect load on mount are wired — requires live environment to verify |
| 9 | User can regenerate suggestions (with confirmation dialog) replacing existing ones | HUMAN NEEDED | AlertDialog and onRegenerate handler are wired — requires browser interaction to verify |
| 10 | On return visits with existing suggestions, the suggestion list appears first and the generation panel is secondary | HUMAN NEEDED | Conditional layout at revision page lines 222-258 implements this — requires live page render to verify |

**Score:** 10/10 truths verified (6 automated + 4 human needed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/db.ts` | suggestions table, SuggestionRow, CRUD, fdxSource | VERIFIED | All required content present at lines 30-141 |
| `src/lib/ai/schemas/suggestion.ts` | Zod schema, SuggestionOutput type | VERIFIED | 10 lines, exports `suggestionSchema` and `SuggestionOutput` |
| `src/lib/suggestions.ts` | WeaknessTarget, extractWeaknesses, suggestionConfig | VERIFIED | 189 lines, substantive implementation with 4 per-type extractors + critic extractor |
| `src/lib/ai/prompts/narrative-suggestion.ts` | narrativeSuggestionPrompt export | VERIFIED | Exports both standard and critic prompts |
| `src/lib/ai/prompts/tv-episodic-suggestion.ts` | tvEpisodicSuggestionPrompt export | VERIFIED | Exists with substantive prompt content |
| `src/lib/ai/prompts/documentary-suggestion.ts` | documentarySuggestionPrompt export | VERIFIED | Exists with substantive prompt content |
| `src/lib/ai/prompts/corporate-suggestion.ts` | corporateSuggestionPrompt export | VERIFIED | Exists with substantive prompt content |
| `src/lib/__tests__/suggestions.test.ts` | Wave 0 test stubs | VERIFIED | 14 `it.todo()` stubs across 4 describe blocks |
| `src/app/api/projects/__tests__/suggestions-route.test.ts` | Wave 0 test stubs | VERIFIED | 9 `it.todo()` stubs in 1 describe block |
| `src/app/api/projects/[id]/suggestions/route.ts` | POST, GET, DELETE handlers + NDJSON streaming | VERIFIED | 166 lines, all 3 handlers, maxDuration=300, concurrency limiter at 3, application/x-ndjson content type |
| `src/components/suggestion-generation-panel.tsx` | Generation control with count input, generate/regenerate, AlertDialog | VERIFIED | 155 lines, full implementation including critic source toggle (post-checkpoint enhancement) |
| `src/components/suggestion-card.tsx` | Individual card with weakness badge, original/rewrite blocks | VERIFIED | 72 lines, role="article", Badge, bg-muted and bg-primary/5 blocks, uppercase labels via CSS |
| `src/components/suggestion-list.tsx` | Streaming list with progress indicator | VERIFIED | 76 lines, role="status", aria-live="polite", streaming indicator, error and partial failure states |
| `src/app/revision/[projectId]/page.tsx` | Full revision page with conditional layout, streaming consumption | VERIFIED | 267 lines, getReader() NDJSON consumption, conditional layout (suggestions-first on return), Phase 17 placeholder preserved |
| `src/components/ui/input.tsx` | shadcn Input | VERIFIED | Exists |
| `src/components/ui/alert-dialog.tsx` | shadcn AlertDialog | VERIFIED | Exists |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/projects/[id]/suggestions/route.ts` | `src/lib/suggestions.ts` | extractWeaknesses + suggestionConfig imports | WIRED | Line 5: imports both `extractWeaknesses`, `extractCriticWeaknesses`, `suggestionConfig` |
| `src/app/api/projects/[id]/suggestions/route.ts` | `src/lib/db.ts` | db.insertSuggestion, db.listSuggestions, db.deleteSuggestionsForProject | WIRED | Lines 63, 116, 158, 164 — all three CRUD methods called in route |
| `src/app/api/projects/[id]/suggestions/route.ts` | NDJSON stream | ReadableStream + application/x-ndjson | WIRED | Lines 80-141, 143-149: ReadableStream with encoder, correct content-type header |
| `src/app/revision/[projectId]/page.tsx` | `/api/projects/[id]/suggestions` | fetch POST for generation, fetch GET for loading | WIRED | Lines 63, 87: both GET (load on mount) and POST (generate) calls present |
| `src/lib/suggestions.ts` | all 4 prompt files | import in suggestionConfig map | WIRED | Lines 1-4: imports all 8 prompt constants (standard + critic per type) |
| `src/app/api/upload/route.ts` | `src/app/page.tsx` | fdxSource returned in upload response | WIRED | Upload route line 38 sets fdxSource; page.tsx line 144 spreads into PUT body |
| `src/app/page.tsx` | `src/app/api/projects/[id]/route.ts` | fdxSource included in PUT body | WIRED | route.ts line 22: `...(body.fdxSource !== undefined && { fdxSource: body.fdxSource })` |
| `src/components/suggestion-list.tsx` | `src/components/suggestion-card.tsx` | imports and renders SuggestionCard | WIRED | Line 4 import, lines 39-50 render loop |
| `src/app/revision/[projectId]/page.tsx` | `src/components/suggestion-generation-panel.tsx` | import and rendered with handlers | WIRED | Line 10 import, lines 232-238 and 242-248 render |
| `src/app/revision/[projectId]/page.tsx` | `src/components/suggestion-list.tsx` | import and rendered with streaming state | WIRED | Line 11 import, lines 224-231 and 249-257 render |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SUGG-01 | 16-02 | User can trigger AI suggestion generation from a completed analysis | SATISFIED | POST /api/projects/[id]/suggestions with analysisData validation (line 20-21); Generate Suggestions button in panel |
| SUGG-02 | 16-01 | Suggestions target specific weaknesses flagged in the analysis | SATISFIED | extractWeaknesses maps all 4 analysis schemas to WeaknessTarget[]; weakness.category and weakness.label used in AI prompt and persisted to DB |
| SUGG-03 | 16-02 | Suggestions stream progressively as they're generated | SATISFIED | NDJSON ReadableStream in route; getReader() buffer pattern in revision page; StreamingIndicator in SuggestionList |
| SUGG-04 | 16-02 | User can set how many suggestions to generate (default ~10) | SATISFIED | count input in SuggestionGenerationPanel (default 10, min 1, max 25); server clamps via `Math.min(Math.max(1, count), 25)` |
| SUGG-05 | 16-01 | Suggestion generation works for all 4 project types | SATISFIED | suggestionConfig map with entries for narrative, tv-episodic, documentary, corporate; 4 dedicated prompt files |
| SUGG-06 | 16-01, 16-02 | Generated suggestions are saved to the database linked to the analysis | SATISFIED | db.insertSuggestion called in stream callback (route line 116); db.listSuggestions used in GET handler; SuggestionRow has projectId FK |

All 6 requirements satisfied. No orphaned requirements found (REQUIREMENTS.md tracks all SUGG-01 through SUGG-06 as Complete under Phase 16).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/__tests__/page.test.tsx` | 358 | TypeScript error (tuple destructuring type mismatch) | Info | Pre-existing test file issue, not in production code. Not introduced by phase 16 — git log confirms this file was not modified in any phase 16 commit. |
| `src/app/settings/__tests__/page.test.tsx` | multiple | 5 test failures | Info | Pre-existing failures from phase 3.1. Git log confirms last modification was commit `3306ab9` (phase 3.1). Not introduced by phase 16. |
| `src/lib/ai/schemas/__tests__/narrative.test.ts` | 77 | 1 test failure (safeParse assertion) | Info | Pre-existing failure from phase 6. Not introduced by phase 16. |

No blockers or warnings introduced by phase 16. All 6 pre-existing failures are in test files not touched by any phase 16 commit (000fb97, 1cf9983, 9521c93, 34666d3, 894ed8d, 300e1df).

### Post-Checkpoint Enhancement (Not in Original Plan)

The SUMMARY documents that after human verification at Task 3 checkpoint, the following was added:

- `extractCriticWeaknesses` function in `suggestions.ts` for parsing structured sections from critic analysis text
- `criticPrompt` variant in all 4 prompt files
- `hasCriticAnalysis` prop and Standard/Harsh Critic toggle in `SuggestionGenerationPanel`
- `analysisType` parameter routing in the POST handler

This enhancement extends SUGG-01 (trigger from completed analysis) to also support critic analysis as a source. It does not break any planned functionality and was user-approved at the checkpoint. Requirements still satisfied.

### Human Verification Required

#### 1. Suggestion Generation End-to-End

**Test:** Open a project with a completed analysis. Navigate to the revision page. Click "Generate Suggestions" (with count set to 3 for speed).
**Expected:** Button shows spinner and "Generating suggestions..." text. Suggestion cards appear one at a time with the streaming indicator showing "Generating suggestion N of 3...". After completion, "3 suggestions generated" appears.
**Why human:** Requires a live AI provider, real NDJSON streaming over HTTP, and browser rendering of the streaming state transitions.

#### 2. Persistence Across Page Refresh

**Test:** After generating suggestions, refresh the browser on the revision page.
**Expected:** Existing suggestions load immediately without re-generating. The suggestion list renders ABOVE the generation panel (not below). The "Regenerate Suggestions" button is visible below the cards.
**Why human:** Requires SQLite persistence, GET endpoint call on mount, and conditional layout rendering in a live browser environment.

#### 3. Regeneration Confirmation Dialog

**Test:** With existing suggestions, click "Regenerate Suggestions".
**Expected:** An AlertDialog appears with title "Regenerate all suggestions?" and description about replacing current suggestions. "Keep Current Suggestions" dismisses without action. "Replace Suggestions" clears and starts streaming new suggestions.
**Why human:** Requires browser interaction with Radix UI AlertDialog component and live regeneration flow.

#### 4. Critic Analysis Source Toggle

**Test:** On a project that has both standard analysis and critic analysis data, open the revision page. Observe the generation panel.
**Expected:** A "Standard Analysis / Harsh Critic" segmented toggle appears below the heading. Selecting "Harsh Critic" shows description text about demanding notes. Generating with this selected produces suggestions that reference the critic analysis sections.
**Why human:** Requires a project with critic analysis data, live AI generation, and visual inspection of the toggle behavior.

### Gaps Summary

No gaps found. All automated checks passed. All 15 artifacts exist and are substantive. All 10 key links are wired. All 6 requirements (SUGG-01 through SUGG-06) are satisfied by real implementation code. The 4 human verification items require live environment testing.

The post-checkpoint enhancement (critic analysis source toggle) extends the planned functionality and does not create any gaps.

---

_Verified: 2026-03-23T10:45:00Z_
_Verifier: Claude (gsd-verifier)_
