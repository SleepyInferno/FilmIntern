---
phase: 02-file-format-support
verified: 2026-03-16T21:32:00Z
status: human_needed
score: 8/8 must-haves verified
human_verification:
  - test: "Upload a real PDF screenplay (not a test fixture) via the browser UI and confirm the parsed preview shows scene headings, character names, and dialogue correctly identified"
    expected: "Parsed preview displays text with format 'pdf-screenplay' in metadata, and the content clearly reflects the screenplay structure"
    why_human: "The PDF parser is unit-tested with a mock -- real pdf-parse v2 behaviour against an actual binary file cannot be verified programmatically without a running app and a real PDF fixture"
  - test: "Upload a real .fdx Final Draft file via the browser UI and confirm scene structure is preserved in the parsed preview"
    expected: "Parsed preview shows scene headings, character names, and dialogue extracted from the FDX XML; format is 'fdx'"
    why_human: "FDX tests use inline XML string fixtures; end-to-end browser upload through the Next.js route with a real .fdx file is required to validate the full content-type + binary path"
  - test: "Upload a real .docx Word document via the browser UI and confirm its content appears in the parsed preview"
    expected: "Parsed preview shows the document text correctly; format is 'docx'"
    why_human: "DOCX tests mock mammoth; real mammoth behaviour against an actual .docx buffer through the upload route needs browser validation"
  - test: "Attempt to upload an unsupported file type (e.g. .mp3) via drag-and-drop on the dropzone"
    expected: "Dropzone rejects the file immediately (client-side) with the message 'Unsupported file type. Accepted formats: .txt, .pdf, .fdx, .docx'"
    why_human: "Dropzone rejection is a browser-level react-dropzone behaviour; cannot be exercised by unit tests alone"
---

# Phase 2: File Format Support Verification Report

**Phase Goal:** User can upload PDF screenplays, Final Draft (.fdx) files, and Word documents with structural formatting preserved for downstream analysis
**Verified:** 2026-03-16T21:32:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | parseFile accepts Buffer\|string and returns Promise\<ParseResult\> | VERIFIED | `registry.ts` line 10: `export async function parseFile(content: Buffer \| string, filename: string): Promise<ParseResult>` |
| 2 | Upload route handles binary formats via arrayBuffer() | VERIFIED | `route.ts` lines 35-36: `const buffer = Buffer.from(await file.arrayBuffer()); result = await parseFile(buffer, file.name)` |
| 3 | Unsupported file extensions return 400 with descriptive error | VERIFIED | `route.ts` lines 22-27: extension check against `ALLOWED_EXTENSIONS`, returns 400 with `Unsupported file format: ${ext}. Accepted formats: ...` |
| 4 | Dropzone accepts .pdf, .fdx, .docx in addition to .txt | VERIFIED | `file-dropzone.tsx` lines 77-83: accept config includes `application/pdf`, `application/xml`, `text/xml`, and DOCX MIME |
| 5 | PDF parser extracts text and detects screenplay structure | VERIFIED | `pdf-parser.ts`: uses `detectScreenplayStructure`, sets `format: 'pdf-screenplay'` when 2+ scene headings found; 6 passing unit tests |
| 6 | FDX parser extracts Final Draft XML with structure preserved | VERIFIED | `fdx-parser.ts`: XMLParser extracts Paragraph elements, handles multi-Text children and single-Paragraph edge case; 5 passing unit tests with real XML fixtures |
| 7 | DOCX parser extracts Word document text | VERIFIED | `docx-parser.ts`: `mammoth.extractRawText({ buffer })` with empty-document error handling; 4 passing unit tests |
| 8 | Registry dispatches all three formats to real parsers | VERIFIED | `registry.ts` lines 1-4: imports `parsePdf`, `parseFdx`, `parseDocx`; lines 20-34: dispatches by extension; no "not yet implemented" stubs |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/parsers/registry.ts` | Async parseFile dispatching by extension | VERIFIED | Async, Buffer\|string input, dispatches to all 3 parsers, throws for unsupported extensions |
| `src/lib/parsers/screenplay-utils.ts` | Screenplay structure detection | VERIFIED | Exports `detectScreenplayStructure` and `ScreenplayElement`; regex-based scene heading, character, dialogue, transition, parenthetical detection |
| `src/lib/parsers/pdf-parser.ts` | PDF text extraction with screenplay detection | VERIFIED | `parsePdf` async, uses pdf-parse v2 class API, calls `detectScreenplayStructure`, sets `pdf-screenplay` format |
| `src/lib/parsers/fdx-parser.ts` | Final Draft XML parsing | VERIFIED | `parseFdx` async, XMLParser from fast-xml-parser, handles Array.isArray edge cases for Paragraph and Text |
| `src/lib/parsers/docx-parser.ts` | Word document text extraction | VERIFIED | `parseDocx` async, `mammoth.extractRawText`, descriptive empty-document error |
| `src/app/api/upload/route.ts` | Binary-aware upload handling | VERIFIED | Extension validation, `file.arrayBuffer()` for non-txt, try/catch error propagation |
| `src/components/file-dropzone.tsx` | Dropzone with PDF/FDX/DOCX MIME types | VERIFIED | All four format MIME types in accept config; updated help text and rejection message |
| `src/lib/types/project-types.ts` | All project types with format-appropriate extensions | VERIFIED | All 5 project types have non-empty acceptedExtensions arrays; narrative/tv-episodic include .fdx |
| `src/lib/parsers/__tests__/pdf-parser.test.ts` | Filled PDF parser tests | VERIFIED | 6 real test implementations, no `it.todo` |
| `src/lib/parsers/__tests__/fdx-parser.test.ts` | Filled FDX parser tests | VERIFIED | 5 real test implementations with XML fixtures, no `it.todo` |
| `src/lib/parsers/__tests__/docx-parser.test.ts` | Filled DOCX parser tests | VERIFIED | 4 real test implementations with mocked mammoth, no `it.todo` |
| `src/lib/parsers/__tests__/screenplay-utils.test.ts` | Filled screenplay-utils tests | VERIFIED | 8 real test implementations covering all element types, no `it.todo` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/upload/route.ts` | `src/lib/parsers/registry.ts` | `await parseFile(buffer, file.name)` | WIRED | Line 36: `result = await parseFile(buffer, file.name)`; Line 33: `result = await parseFile(content, file.name)` |
| `src/components/file-dropzone.tsx` | `/api/upload` | `fetch('/api/upload', ...)` | WIRED | Line 41: `fetch('/api/upload', { method: 'POST', body: formData })` with response handling |
| `src/lib/parsers/registry.ts` | `src/lib/parsers/pdf-parser.ts` | `import { parsePdf }` + `return parsePdf(content, filename)` | WIRED | Line 2 import, line 24 dispatch |
| `src/lib/parsers/registry.ts` | `src/lib/parsers/fdx-parser.ts` | `import { parseFdx }` + `return parseFdx(content, filename)` | WIRED | Line 3 import, line 29 dispatch |
| `src/lib/parsers/registry.ts` | `src/lib/parsers/docx-parser.ts` | `import { parseDocx }` + `return parseDocx(content, filename)` | WIRED | Line 4 import, line 34 dispatch |
| `src/lib/parsers/pdf-parser.ts` | `src/lib/parsers/screenplay-utils.ts` | `import { detectScreenplayStructure }` | WIRED | Line 2 import, line 21 call `detectScreenplayStructure(text)` |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PARSE-02 | 02-01-PLAN, 02-02-PLAN | App parses PDF files with structure-preserving extraction (handles screenplay formatting) | SATISFIED | `pdf-parser.ts` extracts text via pdf-parse v2, `screenplay-utils.ts` detects scene headings/characters/dialogue, format set to `pdf-screenplay` when 2+ scene headings found |
| PARSE-03 | 02-01-PLAN, 02-02-PLAN | App parses Final Draft (.fdx) files preserving scene headings, character names, and dialogue structure | SATISFIED | `fdx-parser.ts` parses FDX XML via fast-xml-parser, extracts Paragraph elements in order (preserving scene heading/character/dialogue sequence), handles multi-Text formatting runs |
| PARSE-04 | 02-01-PLAN, 02-02-PLAN | App parses Word/DOCX files | SATISFIED | `docx-parser.ts` extracts raw text via mammoth with word/line count metadata |

No orphaned requirements — all three Phase 2 requirement IDs are claimed by both plans and all are implemented.

### Anti-Patterns Found

No anti-patterns detected. Full scan of all 7 implementation files found zero occurrences of:
- `TODO`, `FIXME`, `XXX`, `HACK`, `PLACEHOLDER`
- `not yet implemented`
- `return null`, `return {}`, `return []`
- `it.todo` (in test files)

### Human Verification Required

#### 1. PDF Screenplay Upload End-to-End

**Test:** Open the running application in a browser. Upload a real PDF file of a screenplay (e.g. any publicly available screenplay PDF). Submit it via the file dropzone.
**Expected:** The parsed content preview displays the extracted text. If the PDF has 2 or more INT./EXT. scene headings, the metadata format should be `pdf-screenplay`. Character names and dialogue should be present in the extracted text.
**Why human:** Unit tests mock the pdf-parse v2 library. Real binary PDF processing through the Next.js route with an actual PDF buffer has not been exercised. The pdf-parse v2 class-based API (`new PDFParse({ data: buffer })`) differs from the v1 function API — any mismatch in the real library's method signatures or return shape would only surface at runtime.

#### 2. Final Draft (.fdx) Upload End-to-End

**Test:** Upload a real `.fdx` file exported from Final Draft or obtained from an open source screenplay repository.
**Expected:** The parsed preview shows the screenplay text with scene headings, character names, and dialogue. `metadata.format` is `fdx`. No crash or parse error for valid FDX XML.
**Why human:** FDX tests use hand-crafted minimal XML fixtures. Real Final Draft exports may include additional XML elements, encoding differences, or attribute structures not covered by the test fixtures.

#### 3. Word Document (.docx) Upload End-to-End

**Test:** Upload a real `.docx` file (Word document) via the dropzone.
**Expected:** The parsed preview shows the document text content. `metadata.format` is `docx`. Word count and line count are reasonable for the document size.
**Why human:** DOCX tests mock mammoth entirely. Real mammoth behaviour against an actual `.docx` binary (including embedded styles, headers, tables) needs validation.

#### 4. Dropzone Client-Side Rejection

**Test:** Drag and drop a file with an unsupported extension (e.g. `.mp3`, `.csv`) onto the dropzone.
**Expected:** The dropzone immediately shows the rejection message "Unsupported file type. Accepted formats: .txt, .pdf, .fdx, .docx" without making a network request.
**Why human:** react-dropzone MIME-type filtering is browser-environment dependent behaviour; unit tests exercise the POST route rejection but not the client-side dropzone filtering.

### Gaps Summary

No gaps found. All automated checks passed:
- All 4 parser implementation files exist and are substantive (real logic, not stubs)
- All 6 key links are wired (imports present, functions called, return values used)
- All 3 requirement IDs are fully satisfied by concrete implementations
- 51/51 tests pass across the full test suite
- Zero anti-patterns in any implementation file

The phase is blocked from a full "passed" status only by 4 items that require a running browser environment to validate — the real binary file handling path and the client-side dropzone rejection behaviour.

---

_Verified: 2026-03-16T21:32:00Z_
_Verifier: Claude (gsd-verifier)_
