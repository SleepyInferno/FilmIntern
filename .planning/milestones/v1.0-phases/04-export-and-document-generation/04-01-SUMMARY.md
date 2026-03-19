---
phase: 04-export-and-document-generation
plan: 01
subsystem: documents
tags: [tiptap, docx, playwright, document-types, report-normalization]

# Dependency graph
requires:
  - phase: 03-analysis-expansion
    provides: Analysis schemas for all 5 project types (documentary, corporate, narrative, tv-episodic, short-form)
provides:
  - DocumentKind, OutlineMode, ExportFormat type contracts
  - GeneratedDocument interface with cover, content, quoteRefs
  - Project-type-to-document-kind availability matrix
  - Report normalizer registry mapping all 6 analysis schemas to GeneratedDocument
  - buildReportDocument function for converting any analysis into a report record
affects: [04-02, 04-03, 04-04]

# Tech tracking
tech-stack:
  added: ["@tiptap/react", "@tiptap/starter-kit", "@tiptap/pm", "@tiptap/static-renderer", "docx", "playwright"]
  patterns: ["Normalizer registry pattern for analysis-to-document mapping", "Tiptap-compatible JSON content structure", "Stable Q-label quote references"]

key-files:
  created:
    - src/lib/documents/types.ts
    - src/lib/documents/availability.ts
    - src/lib/documents/report-normalization.ts
    - src/lib/documents/report-document.ts
    - src/lib/documents/__tests__/availability.test.ts
    - src/lib/documents/__tests__/report-document.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used Tiptap-compatible JSON as canonical document content format for editor and export compatibility"
  - "Report normalizer registry keyed by AnalysisReportKind avoids documentary-specific branching in buildReportDocument"
  - "Narrative analysis produces two report kinds (structure and coverage) from the same schema"
  - "Corporate soundbites mapped to quoteRefs with same Q-label pattern as documentary keyQuotes"

patterns-established:
  - "Normalizer registry: each analysis schema registers a ReportNormalizer that maps to Tiptap nodes and quote refs"
  - "Availability matrix: centralized DOCUMENT_KIND_MATRIX and OUTLINE_MODE_MATRIX drive all document-type decisions"
  - "Stable quote labels: Q1, Q2, etc. assigned sequentially, preserved across export formats"

requirements-completed: [OUTP-02, OUTP-03]

# Metrics
duration: 6min
completed: 2026-03-17
---

# Phase 4 Plan 01: Shared Document Contracts Summary

**Canonical document types, project-type availability matrix, and normalizer registry converting all 6 analysis schemas into GeneratedDocument records with Tiptap JSON content**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-17T18:35:35Z
- **Completed:** 2026-03-17T18:41:22Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Installed all Phase 4 dependencies (Tiptap, docx, Playwright with Chromium)
- Created shared document type contracts (DocumentKind, OutlineMode, ExportFormat, GeneratedDocument)
- Built project-type-to-document-kind availability matrix with helpers for all 5 project types
- Implemented report normalizer registry with adapters for all 6 analysis schemas
- 38 new tests locking the contract layer, 140 total tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared document contracts and availability matrix**
   - `e00f92d` (test: add failing tests for document availability matrix)
   - `b89e20d` (feat: add document contracts and availability matrix with dependencies)
2. **Task 2: Report normalization and buildReportDocument**
   - `c3913b0` (test: add failing tests for report-document normalization)
   - `8c2bff6` (feat: add report normalization registry and buildReportDocument)

_TDD: Each task has separate test and implementation commits._

## Files Created/Modified
- `src/lib/documents/types.ts` - DocumentKind, OutlineMode, ExportFormat, GeneratedDocument, DocumentQuoteRef, DocumentCover
- `src/lib/documents/availability.ts` - Project-type document availability matrix and helpers
- `src/lib/documents/report-normalization.ts` - AnalysisReportKind union, ReportNormalizer interface, and 6 registered normalizers
- `src/lib/documents/report-document.ts` - buildReportDocument converting any analysis into a GeneratedDocument
- `src/lib/documents/__tests__/availability.test.ts` - 19 tests for availability matrix
- `src/lib/documents/__tests__/report-document.test.ts` - 19 tests for report document building
- `package.json` - Added @tiptap/react, @tiptap/starter-kit, @tiptap/pm, @tiptap/static-renderer, docx, playwright
- `package-lock.json` - Lockfile updated

## Decisions Made
- Used Tiptap-compatible JSON as canonical document content format -- enables both in-app editing and static rendering for export
- Report normalizer registry keyed by AnalysisReportKind avoids documentary-specific branching in buildReportDocument
- Narrative analysis mapped to two report kinds (narrative-structure and narrative-coverage) from the single NarrativeAnalysis schema
- Corporate soundbites mapped to quoteRefs with same Q-label pattern as documentary keyQuotes for consistent export behavior

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Document contracts ready for PDF/DOCX export implementation (04-02)
- Availability matrix ready for UI document tabs and generation buttons (04-03)
- buildReportDocument ready for API route integration (04-02, 04-03)
- All downstream plans can import from src/lib/documents/

## Self-Check: PASSED

All 6 created files verified on disk. All 4 task commits (e00f92d, b89e20d, c3913b0, 8c2bff6) verified in git log.

---
*Phase: 04-export-and-document-generation*
*Completed: 2026-03-17*
