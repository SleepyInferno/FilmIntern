---
phase: 02-file-format-support
plan: 01
subsystem: parsers
tags: [pdf-parse, fast-xml-parser, mammoth, async, buffer, file-upload]

# Dependency graph
requires:
  - phase: 01-vertical-slice
    provides: Parser registry with sync parseFile, upload route, dropzone component
provides:
  - Async parseFile accepting Buffer|string with Promise<ParseResult>
  - Binary-capable upload route with extension validation
  - Dropzone accepting .txt, .pdf, .fdx, .docx formats
  - Project types with format-appropriate accepted extensions
  - Wave 0 test stubs for all new parsers (18 todo tests)
affects: [02-02-PLAN (parser implementations), phase-03 (analysis expansion)]

# Tech tracking
tech-stack:
  added: [pdf-parse, fast-xml-parser, mammoth]
  patterns: [async parser registry, Buffer|string input dispatch, extension-based format validation]

key-files:
  created:
    - src/lib/parsers/__tests__/pdf-parser.test.ts
    - src/lib/parsers/__tests__/fdx-parser.test.ts
    - src/lib/parsers/__tests__/docx-parser.test.ts
    - src/lib/parsers/__tests__/screenplay-utils.test.ts
  modified:
    - src/lib/parsers/registry.ts
    - src/app/api/upload/route.ts
    - src/app/api/upload/__tests__/route.test.ts
    - src/lib/parsers/__tests__/txt-parser.test.ts
    - src/components/file-dropzone.tsx
    - src/lib/types/project-types.ts
    - src/lib/types/__tests__/project-types.test.ts
    - package.json

key-decisions:
  - "Stub .pdf/.fdx/.docx cases throw 'not yet implemented' rather than being absent -- enables extension validation before parsers exist"
  - "Upload route uses text() for .txt and arrayBuffer() for binary formats -- avoids encoding issues"

patterns-established:
  - "Async parser dispatch: registry is async, individual parsers can be sync or async"
  - "Extension-based validation in both upload route and registry with descriptive error messages"

requirements-completed: [PARSE-02, PARSE-03, PARSE-04]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 2 Plan 1: Parser Infrastructure Summary

**Async parser registry with Buffer support, binary upload handling, and format acceptance for PDF/FDX/DOCX across all project types**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T01:19:10Z
- **Completed:** 2026-03-17T01:22:02Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Installed pdf-parse, fast-xml-parser, and mammoth dependencies for upcoming parser implementations
- Made parseFile async accepting Buffer|string, returning Promise<ParseResult> with stub cases for .pdf/.fdx/.docx
- Upload route now validates extensions and handles binary formats via arrayBuffer()
- Dropzone accepts all four format types (.txt, .pdf, .fdx, .docx) with appropriate MIME types
- All five project types have non-empty acceptedExtensions arrays with format-appropriate configurations
- Created 18 todo test stubs across 4 test files covering all PARSE-02/03/04 behaviors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create Wave 0 test stubs** - `61b527b` (feat)
2. **Task 2: Async parseFile, binary upload, expanded format acceptance** - `a59da2e` (feat)

## Files Created/Modified
- `package.json` - Added pdf-parse, fast-xml-parser, mammoth dependencies
- `src/lib/parsers/registry.ts` - Async parseFile with Buffer|string input and .pdf/.fdx/.docx stubs
- `src/app/api/upload/route.ts` - Extension validation, binary handling via arrayBuffer(), try/catch error handling
- `src/app/api/upload/__tests__/route.test.ts` - Tests for .mp4 rejection, unimplemented format error
- `src/lib/parsers/__tests__/txt-parser.test.ts` - Added parseFile registry tests (string, Buffer, unsupported)
- `src/components/file-dropzone.tsx` - Accept config expanded with PDF, FDX, DOCX MIME types
- `src/lib/types/project-types.ts` - All project types populated with appropriate extensions/MIME types
- `src/lib/types/__tests__/project-types.test.ts` - Updated documentary assertion, added narrative test
- `src/lib/parsers/__tests__/pdf-parser.test.ts` - 5 todo stubs for PDF parser
- `src/lib/parsers/__tests__/fdx-parser.test.ts` - 5 todo stubs for FDX parser
- `src/lib/parsers/__tests__/docx-parser.test.ts` - 4 todo stubs for DOCX parser
- `src/lib/parsers/__tests__/screenplay-utils.test.ts` - 4 todo stubs for screenplay detection

## Decisions Made
- Stub .pdf/.fdx/.docx cases throw "not yet implemented" rather than being absent -- enables extension validation before parsers exist
- Upload route uses text() for .txt and arrayBuffer() for binary formats to avoid encoding issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Parser infrastructure is ready for Plan 02 to implement actual PDF, FDX, and DOCX parsers
- All test stubs are in place with todo markers ready to be filled with real test implementations
- Registry dispatch pattern established for easy parser integration

---
*Phase: 02-file-format-support*
*Completed: 2026-03-17*
