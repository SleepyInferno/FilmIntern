---
phase: 04-export-and-document-generation
plan: 03
subsystem: documents
tags: [pdf, docx, playwright, export, tiptap, layout-profiles]

requires:
  - phase: 04-export-and-document-generation
    provides: GeneratedDocument types, report-document builder, availability rules
provides:
  - Shared export-request validation and filename sanitization
  - Layout profile selection (screenplay-document, coverage-report, professional-document)
  - HTML renderer from GeneratedDocument content with cover page and quote appendix
  - PDF exporter using Playwright Chromium with printBackground
  - DOCX exporter using docx library Packer.toBuffer with cover and quote labels
affects: [04-04, export-routes, document-workspace]

tech-stack:
  added: []
  patterns: [shared-layout-profile, canonical-document-export, cover-page-metadata]

key-files:
  created:
    - src/lib/documents/export-request.ts
    - src/lib/documents/export-layout.ts
    - src/lib/documents/render-document-html.ts
    - src/lib/documents/export-pdf.ts
    - src/lib/documents/export-docx.ts
    - src/lib/documents/__tests__/pdf-template.test.ts
    - src/lib/documents/__tests__/docx-export.test.ts
  modified: []

key-decisions:
  - "Hand-rolled Tiptap JSON to HTML walker instead of @tiptap/static-renderer for simpler server-side rendering without ProseMirror dependency"
  - "Exposed buildDocxDocument for test inspection of document structure without Packer serialization"

patterns-established:
  - "Layout profile pattern: getLayoutProfile(document) returns one of three profiles driving both PDF and DOCX formatting"
  - "Cover page metadata pattern: Title, Type, Date, Written by labels rendered consistently in HTML and DOCX"

requirements-completed: [OUTP-02]

duration: 4min
completed: 2026-03-17
---

# Phase 4 Plan 3: Export Pipeline Internals Summary

**Shared PDF/DOCX export pipeline with layout-profile-driven formatting, cover pages, and quote label preservation from canonical GeneratedDocument state**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T18:53:21Z
- **Completed:** 2026-03-17T18:57:41Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Layout profile selection routes narrative/tv to screenplay-document or coverage-report, documentary/corporate to professional-document
- HTML renderer produces complete export pages with cover metadata, styled body content, and quote reference appendix
- PDF exporter uses Playwright Chromium with Letter format and 0.75in margins
- DOCX exporter uses docx library with cover page, body paragraphs, and Q-label quote appendix
- Export-request module provides Zod schema validation and filename sanitization

## Task Commits

Each task was committed atomically:

1. **Task 1: Add exporter tests (TDD RED)** - `86d9487` (test)
2. **Task 1: Fix docx test helper** - `bf9cfe6` (fix)
3. **Task 2: Implement shared export contracts and PDF/DOCX exporters** - `5a12f48` (feat)

**Plan metadata:** (pending)

_Note: TDD tasks have multiple commits (test -> fix -> feat)_

## Files Created/Modified
- `src/lib/documents/export-request.ts` - Zod schema validation and filename sanitization for export payloads
- `src/lib/documents/export-layout.ts` - getLayoutProfile returns screenplay-document, coverage-report, or professional-document
- `src/lib/documents/render-document-html.ts` - HTML rendering with cover page, body content, and quote reference appendix
- `src/lib/documents/export-pdf.ts` - Playwright Chromium PDF generation with printBackground: true
- `src/lib/documents/export-docx.ts` - docx Document/Packer.toBuffer with cover page, body sections, and Q-label quotes
- `src/lib/documents/__tests__/pdf-template.test.ts` - Tests for layout profiles, HTML rendering, and PDF export
- `src/lib/documents/__tests__/docx-export.test.ts` - Tests for DOCX cover labels and quote label preservation

## Decisions Made
- Used hand-rolled Tiptap JSON to HTML walker instead of @tiptap/static-renderer for simpler server-side rendering without needing full ProseMirror extension initialization
- Exposed buildDocxDocument as a named export for test inspection of document structure without going through Packer serialization

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed docx test helper to walk library internal XML tree**
- **Found during:** Task 1 (TDD GREEN verification)
- **Issue:** docx library stores text as bare strings inside root arrays, not as object text properties
- **Fix:** Updated extractAllText walker to collect string leaves from arrays
- **Files modified:** src/lib/documents/__tests__/docx-export.test.ts
- **Verification:** All 12 tests pass
- **Committed in:** bf9cfe6

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test helper fix necessary for correct test assertions. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Export core is ready for route wiring (PDF and DOCX API routes)
- Both formats derive from the same GeneratedDocument state through shared layout profiles
- Cover page metadata and quote labels are consistent across formats

---
*Phase: 04-export-and-document-generation*
*Completed: 2026-03-17*
