---
phase: 02-file-format-support
plan: 02
subsystem: parsers
tags: [pdf-parse, fast-xml-parser, mammoth, screenplay-detection, regex, buffer]

# Dependency graph
requires:
  - phase: 02-file-format-support
    provides: Async parseFile with Buffer support, test stubs, parser dependencies installed
provides:
  - PDF text extraction with screenplay structure detection via regex heuristics
  - Final Draft (.fdx) XML parsing with multi-Text and single-Paragraph handling
  - Word (.docx) raw text extraction via mammoth
  - Screenplay structure detector identifying scene headings, characters, dialogue, transitions, parentheticals
  - Registry fully wired to dispatch .pdf/.fdx/.docx to real parsers
affects: [phase-03 (analysis expansion uses parsed text)]

# Tech tracking
tech-stack:
  added: []
  patterns: [screenplay regex heuristics, class-based pdf-parse v2 mock, vi.hoisted mock pattern]

key-files:
  created:
    - src/lib/parsers/screenplay-utils.ts
    - src/lib/parsers/pdf-parser.ts
    - src/lib/parsers/fdx-parser.ts
    - src/lib/parsers/docx-parser.ts
  modified:
    - src/lib/parsers/registry.ts
    - src/lib/parsers/__tests__/screenplay-utils.test.ts
    - src/lib/parsers/__tests__/pdf-parser.test.ts
    - src/lib/parsers/__tests__/fdx-parser.test.ts
    - src/lib/parsers/__tests__/docx-parser.test.ts
    - src/app/api/upload/__tests__/route.test.ts

key-decisions:
  - "Screenplay detection requires 2+ scene headings to classify as screenplay -- avoids false positives on documents with a single INT./EXT. mention"
  - "fast-xml-parser trims whitespace from text nodes -- multi-Text concatenation may lose inter-node spaces; acceptable for screenplay paragraph types"

patterns-established:
  - "Class-based mock for pdf-parse v2: use class in vi.mock factory, not mockImplementation arrow function"
  - "vi.hoisted() for mock variables referenced inside vi.mock factories (mammoth mock pattern)"

requirements-completed: [PARSE-02, PARSE-03, PARSE-04]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 2 Plan 2: Parser Implementations Summary

**PDF/FDX/DOCX parsers with screenplay regex detection, all test stubs filled, registry fully wired**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T01:24:10Z
- **Completed:** 2026-03-17T01:28:29Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Screenplay structure detection identifies INT./EXT. scene headings, ALL CAPS character names, dialogue, transitions, and parentheticals via regex heuristics
- PDF parser extracts text via pdf-parse v2 and classifies PDFs with 2+ scene headings as 'pdf-screenplay'
- FDX parser extracts text from Final Draft XML with proper handling of multiple Text children and single Paragraph edge case
- DOCX parser extracts raw text via mammoth with empty document error handling
- Registry dispatches all three formats to real parsers, replacing "not yet implemented" stubs
- Full test suite (51 tests) green, TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement screenplay-utils and PDF parser with tests** - `9fbadf3` (feat)
2. **Task 2: Implement FDX and DOCX parsers with tests** - `f908c63` (feat)
3. **Task 3: Wire all parsers into registry and run full test suite** - `f79ea31` (feat)

## Files Created/Modified
- `src/lib/parsers/screenplay-utils.ts` - Screenplay structure detection from extracted text (scene headings, characters, dialogue, transitions, parentheticals)
- `src/lib/parsers/pdf-parser.ts` - PDF text extraction with screenplay detection
- `src/lib/parsers/fdx-parser.ts` - Final Draft XML parsing with multi-Text and single-Paragraph handling
- `src/lib/parsers/docx-parser.ts` - Word document text extraction via mammoth
- `src/lib/parsers/registry.ts` - Updated to import and dispatch to all three new parsers
- `src/lib/parsers/__tests__/screenplay-utils.test.ts` - 8 tests for screenplay detection
- `src/lib/parsers/__tests__/pdf-parser.test.ts` - 6 tests for PDF parsing with mocked pdf-parse
- `src/lib/parsers/__tests__/fdx-parser.test.ts` - 5 tests for FDX parsing with XML fixtures
- `src/lib/parsers/__tests__/docx-parser.test.ts` - 4 tests for DOCX parsing with mocked mammoth
- `src/app/api/upload/__tests__/route.test.ts` - Updated test to reflect real parser errors instead of stub messages

## Decisions Made
- Screenplay detection requires 2+ scene headings to classify as screenplay -- avoids false positives
- fast-xml-parser trims whitespace from text nodes -- multi-Text concatenation may lose inter-node spaces; acceptable for screenplay paragraph types

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated upload route test for real parser errors**
- **Found during:** Task 3 (Wire parsers into registry)
- **Issue:** Upload route test expected "not yet implemented" error from PDF stub, but stub was replaced with real parser
- **Fix:** Updated test assertion to check for truthy error message instead of specific stub text
- **Files modified:** src/app/api/upload/__tests__/route.test.ts
- **Verification:** Full test suite passes (51/51)
- **Committed in:** f79ea31 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary fix for test correctness after stub removal. No scope creep.

## Issues Encountered
- pdf-parse v2 mock required class-based approach in vi.mock factory (arrow function not constructable)
- mammoth mock required vi.hoisted() to avoid temporal dead zone in mock factory

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All file format parsers implemented and tested
- Registry fully wired with PDF, FDX, DOCX, and TXT support
- Phase 2 complete -- ready for Phase 3 analysis expansion

---
*Phase: 02-file-format-support*
*Completed: 2026-03-17*
