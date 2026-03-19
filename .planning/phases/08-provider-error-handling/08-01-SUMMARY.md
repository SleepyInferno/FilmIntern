---
phase: 08-provider-error-handling
plan: 01
subsystem: api
tags: [error-handling, ai-sdk, health-check, provider-validation]

# Dependency graph
requires:
  - phase: 03.1-multi-provider
    provides: provider-registry with buildRegistry, AISettings type
provides:
  - checkProviderHealth function for pre-flight provider validation
  - Structured JSON error responses from analyze route with HTTP status discrimination
  - Client-side display of server-specific error messages
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [health-check pre-flight, AI SDK error class discrimination, structured error JSON responses]

key-files:
  created: []
  modified:
    - src/lib/ai/provider-registry.ts
    - src/lib/ai/__tests__/provider-registry.test.ts
    - src/app/api/analyze/route.ts
    - src/app/api/analyze/__tests__/route.test.ts
    - src/app/page.tsx

key-decisions:
  - "Health check validates merged settings (apiKey from loadSettings), not process.env directly"
  - "Ollama reachability check uses /api/tags endpoint with 3-second AbortSignal timeout"
  - "AI SDK error discrimination uses static isInstance methods rather than instanceof checks"

patterns-established:
  - "Health-check pre-flight: validate provider config before calling streamText"
  - "Error class discrimination: use AI SDK isInstance() for LoadAPIKeyError, APICallError, NoSuchModelError"
  - "Client error propagation: parse response.json() body for server error messages"

requirements-completed: [MPAI-05]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 08 Plan 01: Provider Error Handling Summary

**Health-check pre-flight and AI SDK error discrimination returning user-readable JSON errors instead of 500s**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T13:55:57Z
- **Completed:** 2026-03-19T13:59:55Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- checkProviderHealth validates API key presence (cloud) and server reachability (Ollama) before analysis
- Analyze route catches all AI SDK error types and returns structured JSON with appropriate HTTP status codes (401, 400, 502, 503, 500)
- Client reads server error JSON body and displays specific message instead of generic fallback
- All 27 new + existing tests pass across both test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Add checkProviderHealth function (RED)** - `d91b22b` (test)
2. **Task 1: Add checkProviderHealth function (GREEN)** - `2db65ab` (feat)
3. **Task 2: Add error handling to route + client (RED)** - `c7833a8` (test)
4. **Task 2: Add error handling to route + client (GREEN)** - `33f5380` (feat)

_TDD tasks have separate test and implementation commits_

## Files Created/Modified
- `src/lib/ai/provider-registry.ts` - Added HealthCheckResult interface and checkProviderHealth function
- `src/lib/ai/__tests__/provider-registry.test.ts` - 6 new health check tests (10 total)
- `src/app/api/analyze/route.ts` - Health check pre-flight + try/catch with AI SDK error discrimination
- `src/app/api/analyze/__tests__/route.test.ts` - 6 new error handling tests (17 total)
- `src/app/page.tsx` - Client reads response JSON body for error messages

## Decisions Made
- Health check validates merged settings (apiKey from loadSettings), not process.env directly
- Ollama reachability check uses /api/tags endpoint with 3-second AbortSignal timeout
- AI SDK error discrimination uses static isInstance methods rather than instanceof checks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures in `src/app/settings/__tests__/page.test.tsx` (5 failures) and `src/lib/ai/schemas/__tests__/narrative.test.ts` (1 failure) are unrelated to this plan's changes. Logged as out-of-scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Provider error handling complete for all supported providers
- Ready for phase 08-02 if additional error handling plans exist

## Self-Check: PASSED

All 5 modified files verified present. All 4 task commits verified in git log.

---
*Phase: 08-provider-error-handling*
*Completed: 2026-03-19*
