---
phase: 04-export-and-document-generation
plan: 02
subsystem: api, ui
tags: [tiptap, document-generation, tabs, rich-text-editor, quote-references]

# Dependency graph
requires:
  - phase: 04-export-and-document-generation/04-01
    provides: GeneratedDocument types, availability matrix, report-document builder, report normalization registry
provides:
  - POST /api/documents/generate route with project-type validation
  - Prompt registry for outline, treatment, and proposal generation
  - DocumentWorkspace component with tabbed report and generated document views
  - In-app contenteditable editor for generated documents
  - Export dropdown trigger (PDF/DOCX format selection wired for 04-03)
  - Quote ref click-to-jump with scrollIntoView behavior
affects: [04-03-export-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [contenteditable editor shell, quote-target data attributes for jump navigation, project-type-aware generation buttons]

key-files:
  created:
    - src/app/api/documents/generate/route.ts
    - src/lib/documents/generators/index.ts
    - src/lib/documents/generators/prompts.ts
    - src/components/document-workspace.tsx
    - src/app/api/documents/generate/__tests__/route.test.ts
    - src/components/__tests__/document-workspace.test.tsx
    - src/app/__tests__/page.test.tsx
  modified:
    - src/components/analysis-report.tsx
    - src/app/page.tsx

key-decisions:
  - "Contenteditable div as editor shell instead of full Tiptap editor mount -- simpler for this phase, upgradeable later"
  - "Quote jump targets use data-quote-target attribute with sr-only visibility -- accessible and deterministic"
  - "Export dropdown is a simple state toggle rather than a separate dropdown component -- keeps dependencies minimal"

patterns-established:
  - "Generation route validates project type, document kind, and outline mode in sequence before delegating to generateDocument"
  - "DocumentWorkspace receives all state as props from page -- no internal fetching or side effects"

requirements-completed: [OUTP-03]

# Metrics
duration: 7min
completed: 2026-03-17
---

# Phase 4 Plan 2: Document Generation and Workspace Summary

**POST /api/documents/generate with project-type-aware validation, prompt registry for outline/treatment/proposal, and tabbed DocumentWorkspace with in-app editing and quote-jump navigation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-17T18:43:48Z
- **Completed:** 2026-03-17T18:50:56Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Generation API route validates project type, document kind availability, and outline mode before calling AI
- Prompt builders produce project-type-appropriate content (strategic proposals for documentary/corporate, screenplay treatments for narrative/TV)
- Tabbed workspace renders Report alongside generated documents with contenteditable editor
- Quote references are clickable and jump to matching targets via focus + scrollIntoView
- Export dropdown surfaces PDF and DOCX options ready for Plan 04-03 wiring

## Task Commits

Each task was committed atomically:

1. **Task 1: Lock generation and workspace behavior with tests** - `9fcd0b4` (test)
2. **Task 2: Implement generation route and prompt registry** - `d71bf59` (feat)
3. **Task 3: Wire tabbed document workspace and editing flow** - `f9388e1` (feat)

## Files Created/Modified
- `src/app/api/documents/generate/route.ts` - POST handler with validation chain
- `src/lib/documents/generators/index.ts` - generateDocument with AI text generation, Tiptap JSON parsing, cover/quote assembly
- `src/lib/documents/generators/prompts.ts` - Prompt builders for outline, treatment, proposal
- `src/components/document-workspace.tsx` - Tabbed workspace with editor, export dropdown, quote jump
- `src/app/page.tsx` - State wiring for report document, generated documents, active tab, generation fetch
- `src/components/analysis-report.tsx` - Added action slot prop and data-quote-target markers
- `src/app/api/documents/generate/__tests__/route.test.ts` - 5 route tests
- `src/components/__tests__/document-workspace.test.tsx` - 8 workspace tests
- `src/app/__tests__/page.test.tsx` - 4 page integration tests

## Decisions Made
- Used contenteditable div as editor shell rather than mounting full Tiptap editor instance -- simpler for this phase, can upgrade if needed
- Quote jump targets placed as sr-only spans with data-quote-target attributes for deterministic jump resolution
- Export dropdown implemented as simple state toggle rather than importing a separate dropdown primitive
- Page-level onQuoteJump callback is notification-only -- the workspace handles actual scroll/focus behavior

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed mock response missing cover field in page test**
- **Found during:** Task 3 (page integration tests)
- **Issue:** The generate API mock response in the page test lacked `cover` property, causing workspace to crash on `doc.cover.typeLabel`
- **Fix:** Added complete `cover` object to the mock fetch response
- **Files modified:** src/app/__tests__/page.test.tsx
- **Verification:** All 4 page tests pass
- **Committed in:** f9388e1 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test data correction only. No scope creep.

## Issues Encountered
None beyond the test mock fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Export dropdown wired but does not call export routes yet -- ready for Plan 04-03 to implement PDF/DOCX export
- DocumentWorkspace onExport callback has correct contract `(format: ExportFormat, document: GeneratedDocument) => Promise<void> | void`
- All 157 tests pass across 23 test files

---
*Phase: 04-export-and-document-generation*
*Completed: 2026-03-17*
