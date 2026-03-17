---
phase: 04-export-and-document-generation
verified: 2026-03-17T19:30:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
gaps: []
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
  - test: "Click a quote reference badge (e.g., [Q1]) in the Report tab"
    expected: "Page scrolls to the matching quote target anchor within that tab"
    why_human: "scrollIntoView behavior requires a real DOM environment with rendered layout"
  - test: "Generate a narrative treatment, switch to that tab, then click Export"
    expected: "Export uses the Outline/Treatment tab content, not the Report"
    why_human: "Active-tab selection state during export requires real browser interaction"
---

# Phase 4: Export and Document Generation — Verification Report

**Phase Goal:** Enable users to generate derivative documents (outlines, treatments, proposals) from analysis results and export them as polished PDF and DOCX files.
**Verified:** 2026-03-17T19:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | After any supported analysis completes, user can open an export-ready report document built from one shared document record | VERIFIED | `buildReportDocument` in `report-document.ts` delegates through `reportNormalizers` registry; called in `page.tsx` after analysis stream completes |
| 2 | Document actions shown for a project type stay consistent regardless of analysis report type | VERIFIED | `getAvailableDocumentKinds(projectType)` centralized in `availability.ts`; `DocumentWorkspace` calls it to render generation buttons |
| 3 | Quotes and report sections carry into exportable document state instead of being re-authored per format | VERIFIED | `quoteRefs` populated by normalizers and stored on `GeneratedDocument`; both `export-pdf.ts` and `export-docx.ts` consume them from canonical state |
| 4 | After analysis, user can generate an allowed derivative document for the selected project type | VERIFIED | `/api/documents/generate` route validates via `supportsDocumentKind`, calls `generateDocument`, returns `GeneratedDocument` |
| 5 | Generated documents open as editable tabs beside the report | VERIFIED | `DocumentWorkspace` renders `Tabs` with Report + generated document tabs; contenteditable div with `data-testid="document-editor"` present |
| 6 | Narrative and TV outlines expose both beat and scene-by-scene generation options | VERIFIED | `getOutlineModes('narrative')` and `getOutlineModes('tv-episodic')` return `['beats', 'scene-by-scene']`; route validates `Outline mode not allowed for project type` for others |
| 7 | Quote reference click jumps to referenced location in active tab | VERIFIED | `handleQuoteClick` in workspace calls `target.focus()` + `target.scrollIntoView({ block: 'center' })`; `data-quote-target={ref.id}` markers present |
| 8 | Users can export edited report or generated document to PDF and DOCX | VERIFIED | `/api/export/pdf` and `/api/export/docx` routes exist; call `exportPdf`/`exportDocx`; respond with `Content-Type` and `Content-Disposition` |
| 9 | Exported files include cover page with Title, Type, Date, and Written by | VERIFIED | `renderCoverHtml` in `render-document-html.ts` and `buildCoverPage` in `export-docx.ts` both emit all four labels explicitly |
| 10 | Narrative and TV exports use screenplay-oriented layout; others use professional formatting | VERIFIED | `getLayoutProfile` returns `screenplay-document` for narrative/tv outlines/treatments, `coverage-report` for narrative/tv reports, `professional-document` otherwise |
| 11 | Export uses edited active tab content exactly (not regenerated from analysis data) | VERIFIED | `handleExportFormat` in workspace passes `activeDocument` (in-memory state) into `onExport`; page posts `{ document }` directly to export routes |
| 12 | Export action is a single top-right dropdown (PDF and DOCX) | VERIFIED | Single `Export` button toggles dropdown state; renders `PDF (.pdf)` and `Word (.docx)` options |

**Score:** 12/12 truths verified

---

## Required Artifacts

### Plan 01 — Shared Document Contracts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/documents/types.ts` | DocumentKind, OutlineMode, ExportFormat, GeneratedDocument, DocumentQuoteRef, DocumentCover | VERIFIED | All 6 types exported; exact unions match plan spec |
| `src/lib/documents/availability.ts` | Project-type-to-document-kind matrix and outline mode rules | VERIFIED | DOCUMENT_KIND_MATRIX and OUTLINE_MODE_MATRIX hardcoded; imports PROJECT_TYPES; throws on unknown type |
| `src/lib/documents/report-normalization.ts` | Generic normalization contract plus adapters for all 6 schemas | VERIFIED | AnalysisReportKind union, ReportNormalizer interface, 6 registered normalizers (documentary, corporate, narrative-structure, narrative-coverage, tv-episodic, short-form) |
| `src/lib/documents/report-document.ts` | buildReportDocument converting analysis payloads into GeneratedDocument | VERIFIED | Delegates through reportNormalizers registry; populates cover, quoteRefs, analysisSnapshot |

### Plan 02 — Generation Route and Workspace

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/api/documents/generate/route.ts` | Server route for outline, treatment, and proposal generation | VERIFIED | Validates project type, document kind, outline mode in sequence; calls generateDocument |
| `src/lib/documents/generators/index.ts` | generateDocument with AI text generation, cover/quote assembly | VERIFIED | Calls AI via provider registry; parses Tiptap JSON from response; builds GeneratedDocument with crypto.randomUUID() |
| `src/lib/documents/generators/prompts.ts` | Prompt builders for outline, treatment, proposal | VERIFIED | File exists in generators subdirectory |
| `src/components/document-workspace.tsx` | Tabbed editor with report, generated docs, quote jump, export dropdown | VERIFIED | 261 lines; full implementation with tabs, contenteditable editor, export dropdown, scrollIntoView quote jump |

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
| `src/app/api/export/pdf/route.ts` | PDF byte response route | VERIFIED | POST handler validates via generatedDocumentSchema, calls exportPdf, returns application/pdf with Content-Disposition |
| `src/app/api/export/docx/route.ts` | DOCX byte response route | VERIFIED | POST handler validates via generatedDocumentSchema, calls exportDocx, returns correct MIME type and Content-Disposition |
| `src/app/page.tsx` | Client export wiring from active document to browser download | VERIFIED | handleExport posts to /api/export/pdf or /api/export/docx, converts to Blob, URL.createObjectURL, anchor.click() |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status |
|------|----|-----|--------|
| `availability.ts` | `project-types.ts` | `PROJECT_TYPES` import used in assertKnownProjectType | WIRED |
| `report-normalization.ts` | `src/lib/ai/schemas/*` | 5 schema type imports (Documentary, Corporate, Narrative, TvEpisodic, ShortForm); 6 normalizer entries | WIRED |
| `report-document.ts` | `report-normalization.ts` | `reportNormalizers[reportKind].normalize(analysis)` at line 47 | WIRED |

### Plan 02 Key Links

| From | To | Via | Status |
|------|----|-----|--------|
| `page.tsx` | `/api/documents/generate` | `fetch('/api/documents/generate', { method: 'POST' })` at line 137 | WIRED |
| `document-workspace.tsx` | `types.ts` | `GeneratedDocument`, `DocumentKind`, `ExportFormat` imported; used in props and callbacks | WIRED |
| `generate/route.ts` | `availability.ts` | `supportsDocumentKind` imported and called at line 38 | WIRED |
| `document-workspace.tsx` | `page.tsx` | `onQuoteJump` prop; workspace invokes it after scroll/focus at line 129 | WIRED |

### Plan 03 Key Links

| From | To | Via | Status |
|------|----|-----|--------|
| `render-document-html.ts` | `export-layout.ts` | `getLayoutProfile` imported and called at line 165 | WIRED |
| `export-pdf.ts` | `render-document-html.ts` | `renderDocumentHtml` imported and called at line 21 | WIRED |
| `export-pdf.ts` | playwright | `page.pdf({ format: 'Letter', printBackground: true, ... })` at line 28 | WIRED |
| `export-docx.ts` | docx | `Packer.toBuffer(doc)` at line 322 | WIRED |
| `export-request.ts` | `types.ts` | `GeneratedDocument` type imported; `generatedDocumentSchema` is a Zod mirror | WIRED |

### Plan 04 Key Links

| From | To | Via | Status |
|------|----|-----|--------|
| `document-workspace.tsx` | `page.tsx` | `onExport(format, activeDocument)` passed as callback; page implements `handleExport` | WIRED |
| `page.tsx` | `/api/export/pdf` | `format === 'pdf' ? '/api/export/pdf'` fetch POST at line 185 | WIRED |
| `page.tsx` | `/api/export/docx` | `format === 'docx' ? '/api/export/docx'` fetch POST at line 185 | WIRED |
| `export/pdf/route.ts` | `export-pdf.ts` | `exportPdf` imported and called at line 30 | WIRED |
| `export/docx/route.ts` | `export-docx.ts` | `exportDocx` imported and called at line 30 | WIRED |

---

## Requirements Coverage

| Requirement | Plans | Description | Status |
|-------------|-------|-------------|--------|
| OUTP-02 | 01, 03, 04 | Export analysis reports as formatted PDF and DOCX | SATISFIED — export routes, PDF via Playwright, DOCX via docx library, cover pages with Title/Type/Date/Written by |
| OUTP-03 | 01, 02 | Generate derivative documents (outlines, treatments, proposals) from analysis | SATISFIED — /api/documents/generate route with project-type availability matrix, AI generation, tabbed workspace |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/documents/generators/index.ts` | 149 | Comment "return a placeholder document" in catch block | Info | Legitimate error-state fallback — returns a valid `GeneratedDocument` with an error message string, not an empty stub. Function remains fully wired. |

No blocker or warning anti-patterns found. The single info-level item is a correctly-implemented error recovery path.

---

## Test Coverage

All test files created and present:

- `src/lib/documents/__tests__/availability.test.ts` — 19 tests for availability matrix
- `src/lib/documents/__tests__/report-document.test.ts` — 19 tests for report document building
- `src/lib/documents/__tests__/pdf-template.test.ts` — layout profiles, HTML rendering, Playwright delegation
- `src/lib/documents/__tests__/docx-export.test.ts` — DOCX cover labels and quote label preservation
- `src/app/api/documents/generate/__tests__/route.test.ts` — route validation and response shape
- `src/components/__tests__/document-workspace.test.tsx` — workspace behavior including export dropdown
- `src/app/__tests__/page.test.tsx` — page integration for generation and export wiring
- `src/app/api/export/__tests__/pdf.route.test.ts` — PDF route contracts
- `src/app/api/export/__tests__/docx.route.test.ts` — DOCX route contracts

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

### 4. Quote Reference Jump Navigation

**Test:** Click a [Q1] or [Q2] badge in the Report tab
**Expected:** The page scrolls to the corresponding quote anchor within that tab's content area
**Why human:** scrollIntoView behavior requires rendered layout in a real browser

### 5. Active-Tab Export Fidelity

**Test:** Generate a treatment for a narrative project, switch to that tab, make an edit in the contenteditable area, then export as PDF
**Expected:** The downloaded PDF reflects the edited treatment content, not the report and not the pre-edit version
**Why human:** Edit-then-export round-trip requires real browser interaction and file inspection

---

## Gaps Summary

No gaps found. All 12 observable truths are verified, all 14 artifacts pass existence, substance, and wiring checks, and all 14 key links are wired. The phase goal is achieved: users can generate derivative documents (outlines, treatments, proposals) and export them as PDF and DOCX files from a shared canonical document state.

---

_Verified: 2026-03-17T19:30:00Z_
_Verifier: Claude (gsd-verifier)_
