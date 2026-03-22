---
phase: 16-data-foundation-suggestion-generation
plan: 01
subsystem: database, ai
tags: [sqlite, zod, suggestion-generation, weakness-extraction, fdx]

# Dependency graph
requires:
  - phase: 15-revision-page-shell
    provides: "Revision page container and project navigation"
provides:
  - "suggestions SQLite table with full schema and FK cascade"
  - "SuggestionRow interface and CRUD methods (insert, list, delete)"
  - "fdxSource column on projects table with end-to-end persistence"
  - "suggestionSchema Zod schema for AI output validation"
  - "extractWeaknesses function for all 4 analysis types"
  - "4 per-type suggestion prompt files"
  - "suggestionConfig map mirroring analysisConfig"
  - "Wave 0 test stubs for SUGG-01 through SUGG-06"
affects: [16-02, suggestion-api-route, revision-page]

# Tech tracking
tech-stack:
  added: []
  patterns: [weakness-extraction-switch, suggestion-config-map, fdx-source-propagation]

key-files:
  created:
    - src/lib/ai/schemas/suggestion.ts
    - src/lib/suggestions.ts
    - src/lib/ai/prompts/narrative-suggestion.ts
    - src/lib/ai/prompts/tv-episodic-suggestion.ts
    - src/lib/ai/prompts/documentary-suggestion.ts
    - src/lib/ai/prompts/corporate-suggestion.ts
    - src/lib/__tests__/suggestions.test.ts
    - src/app/api/projects/__tests__/suggestions-route.test.ts
  modified:
    - src/lib/db.ts
    - src/app/api/upload/route.ts
    - src/app/api/projects/[id]/route.ts
    - src/components/file-dropzone.tsx
    - src/app/page.tsx
    - src/contexts/workspace-context.tsx

key-decisions:
  - "Added fdxSource to UploadData interface in workspace-context.tsx for type-safe propagation through client"
  - "Used double type assertion (unknown then Record) for fdxSource assignment on ParseResult in upload route"

patterns-established:
  - "Weakness extraction via type-safe switch on projectType with per-type extraction functions"
  - "suggestionConfig map parallels analysisConfig map for consistent project-type dispatch"
  - "fdxSource propagation pattern: upload route -> FileDropzone callback -> page.tsx PUT -> db.updateProject"

requirements-completed: [SUGG-02, SUGG-05, SUGG-06]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 16 Plan 01: Data Foundation Summary

**Suggestions SQLite table with CRUD, weakness extraction from all 4 analysis types, per-type suggestion prompts, and FDX source end-to-end persistence**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T19:31:48Z
- **Completed:** 2026-03-22T19:36:02Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments
- Suggestions table in SQLite with 10 columns, FK cascade, and CRUD methods (insert, list, delete)
- Weakness extraction from all 4 analysis schema types (narrative, tv-episodic, documentary, corporate) with correct field paths
- 4 per-type suggestion prompt files following established prompt pattern
- fdxSource end-to-end: upload captures raw FDX XML, client propagates via PUT, persisted to projects table
- Wave 0 test stubs covering SUGG-01 through SUGG-06 (23 todo tests)

## Task Commits

Each task was committed atomically:

1. **Task 0: Create Wave 0 test stubs** - `000fb97` (test)
2. **Task 1: Database migrations, types, CRUD, FDX persistence** - `1cf9983` (feat)
3. **Task 2: Suggestion schema, prompts, weakness extraction, config map** - `9521c93` (feat)

## Files Created/Modified
- `src/lib/db.ts` - Added fdxSource migration, suggestions table, SuggestionRow interface, CRUD methods
- `src/lib/ai/schemas/suggestion.ts` - Zod schema for AI suggestion output (4 fields)
- `src/lib/suggestions.ts` - WeaknessTarget type, extractWeaknesses function, suggestionConfig map
- `src/lib/ai/prompts/narrative-suggestion.ts` - Narrative screenplay suggestion prompt
- `src/lib/ai/prompts/tv-episodic-suggestion.ts` - TV/episodic suggestion prompt
- `src/lib/ai/prompts/documentary-suggestion.ts` - Documentary suggestion prompt
- `src/lib/ai/prompts/corporate-suggestion.ts` - Corporate video suggestion prompt
- `src/app/api/upload/route.ts` - Captures raw FDX XML as fdxSource for .fdx files
- `src/app/api/projects/[id]/route.ts` - Accepts fdxSource in PUT handler
- `src/components/file-dropzone.tsx` - Added fdxSource to callback type
- `src/app/page.tsx` - Propagates fdxSource in PUT call to persist project
- `src/contexts/workspace-context.tsx` - Added fdxSource to UploadData interface
- `src/lib/__tests__/suggestions.test.ts` - Wave 0 test stubs (14 todos)
- `src/app/api/projects/__tests__/suggestions-route.test.ts` - Wave 0 test stubs (9 todos)

## Decisions Made
- Added fdxSource to UploadData interface in workspace-context.tsx (not just page.tsx) for type-safe propagation across the client
- Used `(result as unknown as Record<string, unknown>)` double assertion in upload route because ParseResult interface lacks index signature

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added fdxSource to UploadData interface in workspace-context.tsx**
- **Found during:** Task 1
- **Issue:** Plan specified updating FileDropzone and page.tsx types but the underlying UploadData interface in workspace-context.tsx also needed fdxSource for type consistency
- **Fix:** Added `fdxSource?: string` to UploadData interface
- **Files modified:** src/contexts/workspace-context.tsx
- **Verification:** TypeScript compiles clean (no new errors)
- **Committed in:** 1cf9983 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for type safety across client-side fdxSource propagation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All backend infrastructure ready for Plan 02 to build API route and UI
- Suggestion CRUD methods available on db object
- extractWeaknesses and suggestionConfig ready for API route consumption
- fdxSource persisted end-to-end for FDX export in later phases

---
*Phase: 16-data-foundation-suggestion-generation*
*Completed: 2026-03-22*
