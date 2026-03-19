---
phase: 09-harsh-critic-analysis
plan: 01
subsystem: api
tags: [streaming, ai, critic, vercel-ai-sdk, sqlite]

# Dependency graph
requires:
  - phase: 08-provider-error-handling
    provides: Provider health check and error discrimination patterns
provides:
  - Harsh critic streaming API route at /api/analyze/critic
  - Locked industry-critic system prompt with 10-section output structure
  - criticAnalysis DB column and projects API persistence
affects: [09-02, ui, workspace]

# Tech tracking
tech-stack:
  added: []
  patterns: [plain-text-streaming-route, separate-critic-api-endpoint]

key-files:
  created:
    - src/lib/ai/prompts/harsh-critic.ts
    - src/app/api/analyze/critic/route.ts
    - src/app/api/analyze/critic/__tests__/route.test.ts
  modified:
    - src/lib/db.ts
    - src/app/api/projects/[id]/route.ts

key-decisions:
  - "maxDuration=120 for critic route (vs 60 for standard) due to prose-heavy 10-section output"
  - "Plain text streaming (no Output.object/Zod schema) since critic output is prose, not structured data"
  - "criticAnalysis stored as plain string (not JSON.stringify) since it is raw text, not structured data"

patterns-established:
  - "Plain text streaming route pattern: streamText without Output.object for prose-heavy AI responses"
  - "Separate API route pattern for optional second-pass analysis (keeps standard route unchanged)"

requirements-completed: [CRIT-01]

# Metrics
duration: 6min
completed: 2026-03-19
---

# Phase 09 Plan 01: Harsh Critic Backend Summary

**Streaming critic API route with locked 10-section industry-critic prompt, TDD tests, DB migration, and projects API persistence**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-19T14:38:27Z
- **Completed:** 2026-03-19T14:44:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Locked harsh critic system prompt with all 10 required sections, 8 evaluation framework items, and 6 critical rules
- Streaming /api/analyze/critic route with plain text output (no structured schema), health checks, and full error handling
- 11 unit tests covering validation, health check, streaming behavior, error discrimination
- DB migration adding criticAnalysis column with idempotent ALTER TABLE pattern
- Projects PUT API accepts and persists criticAnalysis field

## Task Commits

Each task was committed atomically:

1. **Task 1: Failing tests + system prompt + critic API route** - `a66ad0b` (feat - TDD red then green)
2. **Task 2: DB migration + projects API criticAnalysis persistence** - `bafdf13` (feat)

## Files Created/Modified
- `src/lib/ai/prompts/harsh-critic.ts` - Locked industry-critic system prompt (persona, framework, 10 sections, rules)
- `src/app/api/analyze/critic/route.ts` - Streaming critic API route with maxDuration=120
- `src/app/api/analyze/critic/__tests__/route.test.ts` - 11 unit tests for critic route
- `src/lib/db.ts` - Added criticAnalysis column migration, ProjectRow field, updateProject support
- `src/app/api/projects/[id]/route.ts` - Added criticAnalysis to PUT handler spread pattern

## Decisions Made
- maxDuration set to 120 (double the standard route's 60) for prose-heavy critic output
- Plain text streaming (no Output.object) since the 10-section critic output is prose enforced by prompt, not schema
- criticAnalysis persisted as plain string (not JSON.stringify) since it is raw text from the streaming response
- Anthropic providerOptions uses thinking: disabled (no structuredOutputMode since no schema)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- 6 pre-existing test failures in settings page tests (localStorage mock) and narrative schema test are unrelated to this plan's changes -- confirmed by running the same tests on pre-change code.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Critic API route ready for client-side integration (Plan 09-02)
- DB persistence layer ready for workspace context integration
- System prompt locked and exported for import by any future route

---
*Phase: 09-harsh-critic-analysis*
*Completed: 2026-03-19*
