---
phase: 16-data-foundation-suggestion-generation
plan: 02
subsystem: api, ui
tags: [ndjson, streaming, generateObject, shadcn, suggestion-generation, ai-rewrite]

# Dependency graph
requires:
  - phase: 16-data-foundation-suggestion-generation plan 01
    provides: suggestions table, SuggestionRow CRUD, extractWeaknesses, suggestionConfig, per-type prompts, suggestion schema
provides:
  - Suggestions API route (POST/GET/DELETE) with NDJSON streaming and concurrency limiter
  - SuggestionGenerationPanel component with count input and regeneration dialog
  - SuggestionCard component with weakness badge and original/rewrite blocks
  - SuggestionList component with streaming indicator
  - Revision page integration with conditional layout (suggestions-first on return visits)
  - Critic analysis source toggle for suggestion generation
affects: [17-review-export, revision-page]

# Tech tracking
tech-stack:
  added: [shadcn/input, shadcn/alert-dialog]
  patterns: [NDJSON streaming with ReadableStream, concurrency-limited parallel AI calls, conditional layout reordering]

key-files:
  created:
    - src/app/api/projects/[id]/suggestions/route.ts
    - src/components/suggestion-generation-panel.tsx
    - src/components/suggestion-card.tsx
    - src/components/suggestion-list.tsx
    - src/components/ui/input.tsx
    - src/components/ui/alert-dialog.tsx
  modified:
    - src/app/revision/[projectId]/page.tsx
    - src/lib/suggestions.ts
    - src/lib/ai/prompts/narrative-suggestion.ts
    - src/lib/ai/prompts/tv-episodic-suggestion.ts
    - src/lib/ai/prompts/documentary-suggestion.ts
    - src/lib/ai/prompts/corporate-suggestion.ts

key-decisions:
  - "Added critic analysis source toggle allowing users to generate suggestions from either standard or critic analysis"
  - "Rewrote suggestion prompts with professional screenwriter voice for higher quality output"
  - "Concurrency limiter caps at 3 simultaneous generateObject calls to avoid rate limits"

patterns-established:
  - "NDJSON streaming: ReadableStream with TextEncoder, newline-delimited JSON, error lines with error:true flag"
  - "Concurrency limiter: max 3 parallel AI calls with promise-based queue"
  - "Conditional layout: suggestions-first on return visits, generation-first on fresh projects"

requirements-completed: [SUGG-01, SUGG-03, SUGG-04, SUGG-06]

# Metrics
duration: 45min
completed: 2026-03-23
---

# Phase 16 Plan 02: Suggestion API + Streaming UI Summary

**NDJSON-streaming suggestion API with concurrency-limited parallel AI calls, three UI components (generation panel, card, list), critic/standard analysis source toggle, and conditional revision page layout**

## Performance

- **Duration:** ~45 min (across checkpoint boundary)
- **Started:** 2026-03-22T20:00:00Z
- **Completed:** 2026-03-23T14:36:00Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Suggestions API route with POST (NDJSON streaming generation), GET (list persisted), DELETE (clear all) handlers
- Three custom UI components: SuggestionGenerationPanel with count input and AlertDialog regeneration confirmation, SuggestionCard with weakness badge and original/rewrite text blocks, SuggestionList with streaming indicator
- Revision page fully integrated with generation flow, NDJSON streaming consumption, suggestion loading on mount, and conditional layout (suggestions-first on return visits per CONTEXT.md)
- Post-checkpoint enhancement: critic analysis source toggle allowing users to generate suggestions from either standard or critic analysis, plus rewritten prompts with professional screenwriter voice

## Task Commits

Each task was committed atomically:

1. **Task 1: Suggestions API route with NDJSON streaming** - `34666d3` (feat)
2. **Task 2: Install shadcn components, build UI components, integrate into revision page** - `894ed8d` (feat)
3. **Task 3: Verify suggestion generation end-to-end + critic analysis enhancements** - `300e1df` (feat)

## Files Created/Modified
- `src/app/api/projects/[id]/suggestions/route.ts` - POST/GET/DELETE handlers with NDJSON streaming, analysisType routing
- `src/components/suggestion-generation-panel.tsx` - Generation control card with count input, generate/regenerate buttons, analysis source toggle
- `src/components/suggestion-card.tsx` - Individual suggestion display with weakness badge, original/rewrite blocks
- `src/components/suggestion-list.tsx` - Streaming list container with progress indicator
- `src/components/ui/input.tsx` - shadcn Input component
- `src/components/ui/alert-dialog.tsx` - shadcn AlertDialog component
- `src/app/revision/[projectId]/page.tsx` - Full revision page with suggestion integration, conditional layout
- `src/lib/suggestions.ts` - Added extractCriticWeaknesses, criticPrompt config
- `src/lib/ai/prompts/narrative-suggestion.ts` - Critic prompt + rewritten standard prompt
- `src/lib/ai/prompts/tv-episodic-suggestion.ts` - Critic prompt + rewritten standard prompt
- `src/lib/ai/prompts/documentary-suggestion.ts` - Critic prompt + rewritten standard prompt
- `src/lib/ai/prompts/corporate-suggestion.ts` - Critic prompt + rewritten standard prompt

## Decisions Made
- Added critic analysis source toggle: users can generate suggestions from either standard or critic analysis data, routed via analysisType parameter
- Rewrote all 4 project-type suggestion prompts with professional screenwriter voice for higher quality output
- Concurrency limiter at 3 parallel AI calls balances throughput vs rate limits

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Enhancement] Added critic analysis source toggle and rewritten prompts**
- **Found during:** Task 3 (post-checkpoint verification)
- **Issue:** Users needed ability to generate suggestions from critic analysis (not just standard), and prompts needed professional voice
- **Fix:** Added extractCriticWeaknesses, criticPrompt configs, analysisType routing, and UI toggle
- **Files modified:** 8 files (suggestions.ts, all 4 prompt files, route.ts, panel component, revision page)
- **Verification:** User-approved at checkpoint
- **Committed in:** 300e1df

---

**Total deviations:** 1 enhancement (critic analysis support)
**Impact on plan:** Extends plan scope with complementary feature. No breakage to planned functionality.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Suggestion generation flow complete end-to-end: API, streaming, persistence, UI
- Critic analysis toggle ready for use when critic analysis data is available
- Phase 17 placeholder preserved on revision page for review and export tools
- All 4 project types supported with dedicated prompts

## Self-Check: PASSED

All 8 key files verified present. All 3 task commits (34666d3, 894ed8d, 300e1df) verified in git log.

---
*Phase: 16-data-foundation-suggestion-generation*
*Completed: 2026-03-23*
