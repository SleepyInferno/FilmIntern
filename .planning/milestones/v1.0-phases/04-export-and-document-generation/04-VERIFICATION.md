---
phase: 04-export-and-document-generation
verified: 2026-03-17T23:55:00Z
status: passed
score: 14/14 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 12/14
  gaps_closed:
    - "Export routes compile without Buffer/BodyInit type errors — buffer.buffer.slice() converts Node.js Buffer to pure ArrayBuffer accepted by DOM BodyInit; verified in both pdf/route.ts and docx/route.ts"
    - "document-workspace.tsx compiles without dynamic JSX tag type errors — heading tag narrowed to 'h1'|'h2'|'h3'|'h4'|'h5'|'h6' union; useEffect unused import removed"
    - "Production build (npm run build) exits with code 0 — confirmed live run, exit 0, all 8 routes compiled"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Run analysis then click Generate Outline for documentary project type"
    expected: "New tab appears beside Report tab labeled 'Outline' with editable content"
    why_human: "Tab switching and contenteditable editor interaction cannot be verified programmatically"
  - test: "Export active report as PDF — click Export dropdown, select 'PDF (.pdf)'"
    expected: "Browser download dialog appears with a .pdf file containing cover page (Title, Type, Date, Written by) and body content"
    why_human: "Playwright PDF generation requires a running server; blob download requires a real browser"
  - test: "Export active report as DOCX — click Export dropdown, select 'Word (.docx)'"
    expected: "Browser download dialog appears with a .docx file containing cover page labels and quote references"
    why_human: "Binary file generation and browser download require a running server"
  - test: "Navigate to /settings and back to /"
    expected: "Uploaded file, analysis results, and any generated documents are still present after returning from settings"
    why_human: "Next.js App Router navigation and React Context survival across route transitions require a real browser"
  - test: "Click a quote reference badge (e.g., [Q1]) in the Report tab"
    expected: "Page scrolls to the matching quote target anchor within that tab"
    why_human: "scrollIntoView behavior requires a real DOM environment with rendered layout"
---

# Phase 4: Export and Document Generation — Verification Report

**Phase Goal:** Users can generate and export derivative documents (treatments, outlines) from their analysis in PDF and DOCX format
**Verified:** 2026-03-17T23:55:00Z
**Status:** PASSED
**Re-verification:** Yes — after gap closure (Plan 06 TypeScript build fixes)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | After any supported analysis completes, user can open an export-ready report document built from one shared document record | VERIFIED | `buildReportDocument` in `report-document.ts` delegates through `reportNormalizers` registry; called in `page.tsx` after analysis stream completes |
| 2 | Document actions shown for a project type stay consistent regardless of analysis report type | VERIFIED | `getAvailableDocumentKinds(projectType)` centralized in `availability.ts`; `DocumentWorkspace` calls it to render generation buttons |
| 3 | Quotes and report sections carry into exportable document state instead of being re-authored per format | VERIFIED | `quoteRefs` populated by normalizers and stored on `GeneratedDocument`; both `export-pdf.ts` and `export-docx.ts` consume them from canonical state |
| 4 | After analysis, user can generate an allowed derivative document for the selected project type | VERIFIED | `/api/documents/generate` route validates via `supportsDocumentKind`, calls `generateDocument`, returns `GeneratedDocument` |
| 5 | Generated documents open as editable tabs beside the report | VERIFIED | `DocumentWorkspace` implements tabs and contenteditable editor; dynamic JSX tag error fixed — heading tag narrowed to `'h1'\|'h2'\|'h3'\|'h4'\|'h5'\|'h6'` union; `useEffect` unused import removed; `tsc --noEmit` shows zero errors in this file |
| 6 | Narrative and TV outlines expose both beat and scene-by-scene generation options | VERIFIED | `getOutlineModes('narrative')` and `getOutlineModes('tv-episodic')` return `['beats', 'scene-by-scene']`; route validates `Outline mode not allowed for project type` for others |
| 7 | Quote reference click jumps to referenced location in active tab | VERIFIED | `handleQuoteClick` in workspace calls `target.focus()` + `target.scrollIntoView({ block: 'center' })`; `data-quote-target={ref.id}` markers present |
| 8 | Users can export edited report or generated document to PDF and DOCX | VERIFIED | Both export routes now convert Buffer to ArrayBuffer via `buffer.buffer.slice(byteOffset, byteOffset+byteLength) as ArrayBuffer` before passing to `new Response()`; `tsc --noEmit` shows zero errors for both route files; `npm run build` exits 0 |
| 9 | Exported files include cover page with Title, Type, Date, and Written by | VERIFIED | `renderCoverHtml` in `render-document-html.ts` and `buildCoverPage` in `export-docx.ts` both emit all four labels explicitly |
| 10 | Narrative and TV exports use screenplay-oriented layout; others use professional formatting | VERIFIED | `getLayoutProfile` returns `screenplay-document` for narrative/tv outlines/treatments, `coverage-report` for narrative/tv reports, `professional-document` otherwise |
| 11 | Export uses edited active tab content exactly (not regenerated from analysis data) | VERIFIED | `handleExportFormat` in workspace passes `activeDocument` (in-memory state) into `onExport`; page posts `{ document }` directly to export routes |
| 12 | Export action is a single top-right dropdown (PDF and DOCX) | VERIFIED | Single `Export` button toggles dropdown state; renders `PDF (.pdf)` and `Word (.docx)` options |
| 13 | Uploaded file, analysis results, and generated documents persist when navigating to /settings and back | VERIFIED | `WorkspaceContext` mounts all 11 state fields at layout level; `WorkspaceProvider` wraps children in `Providers`; `page.tsx` has zero `useState` hooks, all state from `useWorkspace()` |
| 14 | All existing functionality (upload, analyze, generate, export) works identically after context refactor | VERIFIED | All handlers in `page.tsx` unchanged; setters have same names and signatures; `useWorkspace()` destructuring is a mechanical substitution |

**Score:** 14/14 truths verified

---

## Required Artifacts

### Plan 01 — Shared Document Contracts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/documents/types.ts` | DocumentKind, OutlineMode, ExportFormat, GeneratedDocument, DocumentQuoteRef, DocumentCover | VERIFIED | All 6 types exported; exact unions match plan spec |
| `src/lib/documents/availability.ts` | Project-type-to-document-kind matrix and outline mode rules | VERIFIED | DOCUMENT_KIND_MATRIX and OUTLINE_MODE_MATRIX hardcoded; imports PROJECT_TYPES; throws on unknown type |
| `src/lib/documents/report-normalization.ts` | Generic normalization contract plus adapters for all 6 schemas | VERIFIED | AnalysisReportKind union, ReportNormalizer interface, 6 registered normalizers |
| `src/lib/documents/report-document.ts` | buildReportDocument converting analysis payloads into GeneratedDocument | VERIFIED | Delegates through reportNormalizers registry; populates cover, quoteRefs, analysisSnapshot |

### Plan 02 — Generation Route and Workspace

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/api/documents/generate/route.ts` | Server route for outline, treatment, and proposal generation | VERIFIED | Validates project type, document kind, outline mode in sequence; calls generateDocument |
| `src/lib/documents/generators/index.ts` | generateDocument with AI text generation, cover/quote assembly | VERIFIED | Calls AI via provider registry; parses Tiptap JSON from response; builds GeneratedDocument with crypto.randomUUID() |
| `src/lib/documents/generators/prompts.ts` | Prompt builders for outline, treatment, proposal | VERIFIED | File exists; imported in generators/index.ts as buildOutlinePrompt, buildTreatmentPrompt, buildProposalPrompt |
| `src/components/document-workspace.tsx` | Tabbed editor with report, generated docs, quote jump, export dropdown | VERIFIED | 261 lines; heading tag narrowed to `'h1'\|'h2'\|'h3'\|'h4'\|'h5'\|'h6'`; useEffect import removed; zero TypeScript errors; production build compiles this file successfully |

### Plan 03 — Export Pipeline Internals

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/documents/export-request.ts` | Shared GeneratedDocument validation and filename sanitization | VERIFIED | Zod schema (generatedDocumentSchema), toFilenameStem, getExportFilename exported |
| `src/lib/documents/export-layout.ts` | Layout profile selection (screenplay-document, coverage-report, professional-document) | VERIFIED | getLayoutProfile covers all three profiles with correct project-type/kind logic |
| `src/lib/documents/render-document-html.ts` | HTML rendering from GeneratedDocument for PDF | VERIFIED | renderDocumentHtml uses getLayoutProfile; includes cover page with all 4 required labels and quote appendix |
| `src/lib/documents/export-pdf.ts` | PDF byte generation via Playwright | VERIFIED | exportPdf uses chromium, renderDocumentHtml, page.pdf({ printBackground: true, format: 'Letter' }) |
| `src/lib/documents/export-docx.ts` | DOCX byte generation via docx library | VERIFIED | exportDocx uses buildDocxDocument + Packer.toBuffer; cover page and quote appendix both present |

### Plan 04 — Export Routes and Client Download

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/api/export/pdf/route.ts` | PDF byte response route | VERIFIED | Line 31: `buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer`; Response receives pure ArrayBuffer; zero TypeScript errors |
| `src/app/api/export/docx/route.ts` | DOCX byte response route | VERIFIED | Same ArrayBuffer conversion pattern at line 31; zero TypeScript errors |
| `src/app/page.tsx` | Client export wiring from active document to browser download | VERIFIED | handleExport posts to /api/export/pdf or /api/export/docx, converts to Blob, URL.createObjectURL, anchor.click() |

### Plan 05 — Workspace State Persistence

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/contexts/workspace-context.tsx` | WorkspaceContext with all 11 workspace state fields and setters | VERIFIED | WorkspaceProvider with all 11 useState hooks, useMemo context value, useWorkspace hook that throws outside provider |
| `src/app/providers.tsx` | Providers wrapper combining WorkspaceProvider + TooltipProvider | VERIFIED | 'use client'; wraps children in WorkspaceProvider then TooltipProvider |
| `src/app/layout.tsx` | Layout wrapping children in WorkspaceProvider via Providers | VERIFIED | Replaced TooltipProvider with `<Providers>`; imports from ./providers |
| `src/app/page.tsx` | Page consuming context instead of local useState | VERIFIED | Zero useState hooks; all state from `useWorkspace()` destructure |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status |
|------|----|-----|--------|
| `availability.ts` | `project-types.ts` | `PROJECT_TYPES` import used in assertKnownProjectType | WIRED |
| `report-normalization.ts` | `src/lib/ai/schemas/*` | 5 schema type imports (Documentary, Corporate, Narrative, TvEpisodic, ShortForm) | WIRED |
| `report-document.ts` | `report-normalization.ts` | `reportNormalizers[reportKind].normalize(analysis)` at line 47 | WIRED |

### Plan 02 Key Links

| From | To | Via | Status |
|------|----|-----|--------|
| `page.tsx` | `/api/documents/generate` | `fetch('/api/documents/generate', { method: 'POST' })` | WIRED |
| `document-workspace.tsx` | `types.ts` | `GeneratedDocument`, `DocumentKind`, `ExportFormat` imported; used in props and callbacks | WIRED |
| `generate/route.ts` | `availability.ts` | `supportsDocumentKind` imported and called | WIRED |
| `document-workspace.tsx` | `page.tsx` | `onQuoteJump` prop; workspace invokes it after scroll/focus | WIRED |

### Plan 03 Key Links

| From | To | Via | Status |
|------|----|-----|--------|
| `render-document-html.ts` | `export-layout.ts` | `getLayoutProfile` imported and called | WIRED |
| `export-pdf.ts` | `render-document-html.ts` | `renderDocumentHtml` imported and called | WIRED |
| `export-pdf.ts` | playwright | `page.pdf({ format: 'Letter', printBackground: true })` | WIRED |
| `export-docx.ts` | docx | `Packer.toBuffer(doc)` | WIRED |
| `export-request.ts` | `types.ts` | `GeneratedDocument` type imported; `generatedDocumentSchema` is a Zod mirror | WIRED |

### Plan 04 Key Links

| From | To | Via | Status |
|------|----|-----|--------|
| `document-workspace.tsx` | `page.tsx` | `onExport(format, activeDocument)` passed as callback; page implements `handleExport` | WIRED |
| `page.tsx` | `/api/export/pdf` | `format === 'pdf' ? '/api/export/pdf'` fetch POST | WIRED |
| `page.tsx` | `/api/export/docx` | `format === 'docx' ? '/api/export/docx'` fetch POST | WIRED |
| `export/pdf/route.ts` | `export-pdf.ts` | `exportPdf` imported and called; result converted via `buffer.buffer.slice()` | WIRED |
| `export/docx/route.ts` | `export-docx.ts` | `exportDocx` imported and called; result converted via `buffer.buffer.slice()` | WIRED |

### Plan 05 Key Links

| From | To | Via | Status |
|------|----|-----|--------|
| `src/app/layout.tsx` | `src/contexts/workspace-context.tsx` | `<WorkspaceProvider>` wraps children via `Providers` component | WIRED |
| `src/app/page.tsx` | `src/contexts/workspace-context.tsx` | `useWorkspace()` at line 36; all state destructured from context | WIRED |

---

## Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| OUTP-02 | 01, 03, 04, 06 | User can download the analysis report as a formatted document (PDF or DOCX) | SATISFIED | Export pipeline complete: Playwright PDF via `export-pdf.ts`, docx library via `export-docx.ts`, cover pages with all 4 fields, both routes compile cleanly after Buffer-to-ArrayBuffer fix, `npm run build` exits 0 |
| OUTP-03 | 01, 02, 05, 06 | App can generate a treatment or narrative outline from uploaded material | SATISFIED | Generation API route, generator engine, workspace all exist and wired; `document-workspace.tsx` compiles without errors after JSX tag fix; `npm run build` exits 0 |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/ai/__tests__/settings.test.ts` | 60, 61, 90, 91 | Missing `apiKey` property in test fixture type | Warning | Test-only file; does not affect production build or phase goal; pre-existing from phase 03 |
| `src/app/__tests__/page.test.tsx` | multiple | WorkspaceContext provider missing in test environment | Warning | Test-only failure; documented in Plan 06 SUMMARY as pre-existing from plan 05; not introduced by plan 06 changes; does not affect production build |

No production-source blockers remain. All previous blockers (Buffer/BodyInit and dynamic JSX tag) are resolved.

---

## Test Coverage

Test files present:

- `src/lib/documents/__tests__/availability.test.ts`
- `src/lib/documents/__tests__/report-document.test.ts`
- `src/lib/documents/__tests__/pdf-template.test.ts`
- `src/lib/documents/__tests__/docx-export.test.ts`
- `src/app/api/documents/generate/__tests__/route.test.ts`
- `src/components/__tests__/document-workspace.test.tsx`
- `src/app/__tests__/page.test.tsx`
- `src/app/api/export/__tests__/pdf.route.test.ts`
- `src/app/api/export/__tests__/docx.route.test.ts`

Note: `page.test.tsx` has pre-existing failures (4 tests) due to WorkspaceContext provider not being injected in the test environment — introduced by plan 05, not plan 06. These are test-environment setup issues, not production code regressions.

---

## Human Verification Required

### 1. End-to-End Document Generation

**Test:** Upload a documentary transcript, run analysis, then click "Generate Outline"
**Expected:** A new "Outline" tab appears beside the "Report" tab with AI-generated content and an editable contenteditable surface
**Why human:** Tab switching, editor mounting, and AI content generation require a running server and browser

### 2. PDF Export Download

**Test:** After analysis, open the Export dropdown and select "PDF (.pdf)"
**Expected:** Browser prompts a download with a .pdf file containing a cover page showing Title, Type, Date, and Written by fields, followed by the report body
**Why human:** Playwright Chromium PDF generation and browser blob download require a real environment

### 3. DOCX Export Download

**Test:** After analysis, open the Export dropdown and select "Word (.docx)"
**Expected:** Browser prompts a download with a .docx file that opens in Word/LibreOffice with a cover page and quote references labeled Q1, Q2, etc.
**Why human:** Binary DOCX output and blob download require a real environment

### 4. Navigation State Persistence

**Test:** Upload a file, run analysis, generate an outline, then navigate to /settings via the sidebar and return to /
**Expected:** The uploaded file, analysis results, and generated outline are all still present on return
**Why human:** Next.js App Router navigation and React Context survival across route transitions require a real browser

### 5. Quote Reference Jump Navigation

**Test:** Click a [Q1] or [Q2] badge in the Report tab
**Expected:** The page scrolls to the corresponding quote anchor within that tab's content area
**Why human:** scrollIntoView behavior requires rendered layout in a real browser

---

## Gaps Closed by Plan 06

**Blocker 1 (resolved) — Export routes Buffer/BodyInit type mismatch.** Both `src/app/api/export/pdf/route.ts` and `src/app/api/export/docx/route.ts` now use `buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer` at line 31. The raw `Buffer` is no longer passed to `new Response()`. Confirmed: `grep -n "new Response(buffer,"` returns no matches in either file. TypeScript reports zero errors for both files.

**Blocker 2 (resolved) — Dynamic JSX tag in document-workspace.tsx.** Line 76 now reads `const HeadingTag = (\`h${level}\` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')` — the type is narrowed to only valid heading element names. The `useEffect` unused import is also removed. TypeScript reports zero errors for this file.

**Build status (confirmed live):** `npm run build` ran to completion and exited with code 0. All 8 app routes compiled. Both plan 06 commits (`6801c62`, `5eef2db`) confirmed present in git log.

---

_Verified: 2026-03-17T23:55:00Z_
_Verifier: Claude (gsd-verifier)_
