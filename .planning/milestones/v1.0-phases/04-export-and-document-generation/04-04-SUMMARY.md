---
phase: 04-export-and-document-generation
plan: 04
subsystem: api, export, ui
tags: [pdf, docx, export, api-routes, blob-download, zod]

# Dependency graph
requires:
  - phase: 04-02
    provides: DocumentWorkspace with export dropdown and active document selection
  - phase: 04-03
    provides: exportPdf and exportDocx internals with generatedDocumentSchema validation
provides:
  - PDF export API route at /api/export/pdf
  - DOCX export API route at /api/export/docx
  - Page-level browser download flow wired to active document tab
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [route-level Zod validation with generatedDocumentSchema, blob download via createObjectURL]

key-files:
  created:
    - src/app/api/export/pdf/route.ts
    - src/app/api/export/docx/route.ts
    - src/app/api/export/__tests__/pdf.route.test.ts
    - src/app/api/export/__tests__/docx.route.test.ts
  modified:
    - src/app/page.tsx
    - src/lib/documents/export-request.ts
    - src/components/__tests__/document-workspace.test.tsx

key-decisions:
  - "Fixed Zod v4 z.record(z.unknown()) crash in jsdom by using z.record(z.string(), z.any())"

patterns-established:
  - "Export route pattern: Zod validate request body, call exporter, return binary Response with Content-Type and Content-Disposition"
  - "Client download pattern: fetch route, response.blob(), URL.createObjectURL, anchor.click()"

requirements-completed: [OUTP-02]

# Metrics
duration: 13min
completed: 2026-03-17
---

# Phase 4 Plan 4: Export Routes and Client Download Wiring Summary

**PDF and DOCX export API routes with Zod-validated request bodies and page-level blob download flow from the active document tab**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-17T19:01:20Z
- **Completed:** 2026-03-17T19:14:20Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- PDF and DOCX export routes with proper content types and Content-Disposition headers
- Page-level onExport callback wired to trigger browser downloads from active document tab
- Full test coverage for route contracts and workspace export dropdown behavior
- Fixed Zod v4 compatibility bug with z.record(z.unknown()) in jsdom test environment

## Task Commits

Each task was committed atomically:

1. **Task 1: Add export route and active-document wiring tests (RED)** - `b117d0b` (test)
2. **Task 1: Export routes and Zod fix (GREEN)** - `a32af59` (feat)
3. **Task 2: Wire page-level export download flow** - `096f7c2` (feat)

## Files Created/Modified
- `src/app/api/export/pdf/route.ts` - PDF export POST handler with Zod validation
- `src/app/api/export/docx/route.ts` - DOCX export POST handler with Zod validation
- `src/app/api/export/__tests__/pdf.route.test.ts` - PDF route contract tests
- `src/app/api/export/__tests__/docx.route.test.ts` - DOCX route contract tests
- `src/app/page.tsx` - handleExport wired with fetch, blob download, Content-Disposition filename
- `src/lib/documents/export-request.ts` - Fixed z.record(z.unknown()) to z.record(z.string(), z.any())
- `src/components/__tests__/document-workspace.test.tsx` - Extended with export dropdown behavior tests

## Decisions Made
- Fixed Zod v4 z.record(z.unknown()) crash in jsdom by using z.record(z.string(), z.any()) -- Zod v4 internal _zod property is undefined for z.unknown() as record value type in jsdom environment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod v4 z.record(z.unknown()) crash in jsdom**
- **Found during:** Task 1 (GREEN phase - making route tests pass)
- **Issue:** z.record(z.unknown()).optional() throws TypeError "Cannot read properties of undefined (reading '_zod')" when safeParse receives a value in jsdom test environment
- **Fix:** Changed z.record(z.unknown()) to z.record(z.string(), z.any()) in generatedDocumentSchema
- **Files modified:** src/lib/documents/export-request.ts
- **Verification:** All 176 tests pass including new route and workspace tests
- **Committed in:** a32af59 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for Zod v4 compatibility. No scope creep.

## Issues Encountered
- Test import paths from __tests__ to route files required correction (relative vs absolute @/ paths)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Export pipeline is complete: routes, internals, and client download flow all wired
- Phase 4 (Export and Document Generation) is fully complete
- All OUTP-02 requirements satisfied

---
*Phase: 04-export-and-document-generation*
*Completed: 2026-03-17*
