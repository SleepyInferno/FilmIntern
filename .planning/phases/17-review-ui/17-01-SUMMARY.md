---
phase: 17-review-ui
plan: 01
subsystem: api, database, ui, testing
tags: [diff, better-sqlite3, word-diff, suggestion-status, react-component]

# Dependency graph
requires:
  - phase: 16-suggestions
    provides: suggestions table, insertSuggestion, listSuggestions methods
provides:
  - status column on suggestions table with pending/accepted/rejected tracking
  - PATCH endpoint for suggestion status updates
  - computeWordDiff utility wrapping diffWordsWithSpace
  - DiffDisplay component for inline word-level diff rendering
  - Wave 0 test scaffolds for REVW-01/02/03/04
affects: [17-02-review-ui-components, script-preview, suggestion-regenerate]

# Tech tracking
tech-stack:
  added: [diff, "@types/diff"]
  patterns: [word-level-diff-rendering, suggestion-status-lifecycle, reverse-index-replacement]

key-files:
  created:
    - src/lib/diff-utils.ts
    - src/components/diff-display.tsx
    - src/app/api/projects/[id]/suggestions/[suggestionId]/route.ts
    - src/lib/__tests__/diff-utils.test.ts
    - src/lib/__tests__/db-suggestions.test.ts
    - src/lib/__tests__/script-preview.test.ts
    - src/app/api/projects/__tests__/suggestion-regenerate.test.ts
  modified:
    - src/lib/db.ts
    - package.json

key-decisions:
  - "Made insertSuggestion status parameter optional to avoid breaking existing callers"
  - "Used diff library (diffWordsWithSpace) for word-level diff computation"

patterns-established:
  - "Suggestion status lifecycle: pending -> accepted/rejected, rewrite resets to pending"
  - "Reverse-index sort for multi-replacement to prevent offset drift"

requirements-completed: [REVW-01, REVW-02, REVW-03, REVW-04]

# Metrics
duration: 3min
completed: 2026-03-23
---

# Phase 17 Plan 01: Review UI Foundation Summary

**Word-level diff utility, suggestion status DB migration with PATCH API, DiffDisplay component, and Wave 0 test scaffolds for REVW-01/02/03/04**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-23T16:04:34Z
- **Completed:** 2026-03-23T16:07:56Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- SuggestionRow extended with status field (pending/accepted/rejected) and DB migration
- Three new db methods: getSuggestion, updateSuggestionStatus, updateSuggestionRewrite
- DiffDisplay component renders inline word-level diffs with red strikethrough / green highlight
- PATCH endpoint validates status, checks project/suggestion existence, updates DB
- 12 passing tests across diff-utils (5) and script-preview (7) test suites

## Task Commits

Each task was committed atomically:

1. **Task 1: Install diff package, add DB migration + new methods, create diff utility** - `1a9094c` (feat)
2. **Task 2: Create DiffDisplay component and status PATCH API route** - `0f01908` (feat)
3. **Task 3: Create Wave 0 test scaffolds for REVW-01/02/03/04** - `b5560ba` (test)

## Files Created/Modified
- `src/lib/db.ts` - Added status field to SuggestionRow, migration, 3 new methods
- `src/lib/diff-utils.ts` - computeWordDiff wrapper around diffWordsWithSpace
- `src/components/diff-display.tsx` - DiffDisplay component with red/green word-level diff
- `src/app/api/projects/[id]/suggestions/[suggestionId]/route.ts` - PATCH endpoint for status updates
- `src/lib/__tests__/diff-utils.test.ts` - 5 tests for computeWordDiff
- `src/lib/__tests__/db-suggestions.test.ts` - 3 tests for suggestion status DB methods
- `src/lib/__tests__/script-preview.test.ts` - 7 tests for applyAcceptedRewrites algorithm
- `src/app/api/projects/__tests__/suggestion-regenerate.test.ts` - Mock-based tests for REVW-04 regeneration endpoint
- `package.json` - Added diff and @types/diff dependencies

## Decisions Made
- Made insertSuggestion status parameter optional (`Omit<SuggestionRow, 'createdAt' | 'status'> & { status?: string }`) to avoid breaking existing suggestion generation route callers
- Used `diff` library (diffWordsWithSpace) as specified in research phase

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Made insertSuggestion status optional for backward compatibility**
- **Found during:** Task 1 (DB migration)
- **Issue:** Adding required `status` to SuggestionRow broke existing `insertSuggestion` call in suggestions route (no status field passed)
- **Fix:** Changed insertSuggestion signature to make status optional with 'pending' default
- **Files modified:** src/lib/db.ts
- **Verification:** TypeScript compiles, existing callers unaffected
- **Committed in:** 1a9094c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for backward compatibility. No scope creep.

## Issues Encountered
- Pre-existing TypeScript error in `src/app/__tests__/page.test.tsx:358` (unrelated to this plan). Not addressed per scope boundary rules.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Status column, PATCH API, diff utility, and DiffDisplay component ready for Plan 02 UI integration
- Regenerate endpoint route file needs to be created in Plan 02 for regenerate test to pass

---
*Phase: 17-review-ui*
*Completed: 2026-03-23*
