---
status: diagnosed
phase: 04-export-and-document-generation
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md]
started: 2026-03-17T21:00:00Z
updated: 2026-03-17T21:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Document workspace appears after analysis
expected: After running an analysis, a tabbed document workspace appears below (or alongside) the report. There should be at least a "Report" tab visible, with generation buttons for your project type.
result: issue
reported: "After upload if I go to settings and back to Projects, the script I uploaded is gone. I need it persistent"
severity: major

### 2. Generate a document
expected: Click one of the document generation buttons (e.g., "Outline", "Treatment", or "Proposal"). The app sends a request to AI and a new tab appears with the generated document content displayed.
result: skipped
reason: Blocked by state persistence issue — analysis lost on navigation

### 3. In-app document editing
expected: In a generated document tab, click into the document content area. You should be able to type and edit the text directly. Changes appear immediately in the content area.
result: skipped
reason: Blocked by state persistence issue

### 4. Quote reference jump
expected: In a generated document, clickable quote references (Q1, Q2, etc.) appear inline. Clicking one scrolls/jumps to the matching quote in the report section.
result: skipped
reason: Blocked by state persistence issue

### 5. Export dropdown opens
expected: A button to export appears on a generated document tab. Clicking it opens a dropdown showing "PDF" and "DOCX" as options.
result: skipped
reason: Blocked by state persistence issue

### 6. PDF download
expected: Click "Export as PDF". A PDF file is downloaded to your browser's downloads. The file should open and contain the document content with a cover page.
result: skipped
reason: Blocked by state persistence issue

### 7. DOCX download
expected: Click "Export as DOCX". A .docx file is downloaded to your browser's downloads. The file should open in Word/Docs and contain the document content with a cover page.
result: skipped
reason: Blocked by state persistence issue

### 8. Export uses active tab document
expected: Switch to a different generated document tab, then export. The downloaded file reflects the currently active tab's document — not a previously viewed one.
result: skipped
reason: Blocked by state persistence issue

## Summary

total: 8
passed: 0
issues: 1
pending: 0
skipped: 7

## Gaps

- truth: "Uploaded file, analysis results, and generated documents persist when navigating away and returning"
  status: failed
  reason: "User reported: After upload if I go to settings and back to Projects, the script I uploaded is gone. I need it persistent"
  severity: major
  test: 1
  root_cause: "All workspace state (uploadData, analysisData, reportDocument, generatedDocuments) lives in useState hooks inside the Home page component (src/app/page.tsx). Next.js App Router unmounts page components on navigation, destroying all React state. No persistence layer exists. Fix: lift state into a React Context provider mounted at layout level (layout never unmounts during in-app navigation)."
  artifacts:
    - path: "src/app/page.tsx"
      issue: "All workspace state in local useState — lines 41-53"
    - path: "src/app/layout.tsx"
      issue: "No context provider — state cannot survive page transitions"
  missing:
    - "WorkspaceContext provider wrapping layout children"
    - "page.tsx reads/writes state from context instead of local useState"
  debug_session: ""
