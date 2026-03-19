# Phase 4: Export and Document Generation - Research

**Researched:** 2026-03-16
**Domain:** rich-text document generation, export pipelines, and derivative document workflows in Next.js
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Export should use one primary action in the report header area with a format dropdown rather than separate PDF and DOCX buttons.
- Both PDF and DOCX must be supported and selectable.
- Export actions should live in the top-right or equivalent professional action area rather than at the bottom of the page.
- Export should generate a cleaned, formatted document version rather than a literal copy of the on-screen UI.
- If delayed/background generation does not materially improve quality, use the simpler flow.

- Every project type should offer an Outline output.
- Treatment output is only for Narrative Film and TV / Episodic projects.
- Documentary and Corporate Interview projects should generate a strategic summary/proposal-style document rather than a treatment.
- Narrative and TV outlines should support both high-level beat form and scene-by-scene structure.
- Output availability should not vary based on input file type; import support stays consistent across project types.

- Generated documents should be editable in-app before export.
- Editing should feel like a simple rich-text editor for this phase rather than a highly structured template editor.
- Export should use the edited version exactly, not the original generated draft.
- Report, outline, treatment, and proposal-style outputs should be selectable as export variants.

- Exported documents should feel like polished studio/client deliverables with strong readability.
- Visual style should stay minimal and professional rather than heavily branded.
- Exported documents should include a cover page with Title, Type, Date, and Written by.
- Narrative and TV exports should use proper screenplay-style formatting where applicable.
- Documentary and Corporate exports should use polished professional document formatting rather than screenplay formatting.

- Generated documents should appear as tabs alongside the analysis report rather than in a separate workspace.
- Treatment and Outline generation should be triggered by dedicated buttons after analysis, not auto-generated.
- Quotes should be clickable in-app and jump to the relevant place in the current document/report view.
- Exported PDF and DOCX files should preserve readable quote references/labels even though they are not interactive.

### Claude's Discretion
- Exact visual styling details inside the minimal/professional direction
- Whether background generation is warranted for specific export cases
- Exact naming of strategic-summary/proposal outputs for documentary and corporate projects
- Exact tab labeling and action wording as long as the document types remain clear

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OUTP-02 | User can download the analysis report as a formatted document (PDF or DOCX) | Shared export model, dedicated PDF/DOCX routes, server-side PDF rendering, DOCX generator, export-focused tests |
| OUTP-03 | App can generate a treatment or narrative outline from uploaded material | Project-type-aware document availability, generation route, editable rich-text workspace, per-document export pipeline |
</phase_requirements>

## Summary

Phase 4 should not export the existing screen UI. The stable architecture is: generate a document record, store one canonical rich-text body for editing, and derive both PDF and DOCX from that shared state. This matches the product decisions that exports must be polished deliverables, editable in-app, and faithful to the edited version rather than the original generation.

For this stack, the practical fit with the current Next.js app is Tiptap for editing and canonical document JSON, Playwright Chromium for PDF rendering, and `docx` for DOCX output. This avoids the two common failure modes in this domain: low-quality browser PDF hacks and hand-rolled DOCX packaging. It also keeps the current single-page flow intact by extending `src/app/page.tsx` with post-analysis document tabs instead of inventing a separate workspace.

The main planning risk is upstream dependency: Phase 4 depends on Phase 3 project-type analyses, but the repo still only supports documentary analysis today. Plan the phase so export infrastructure and document workspace are reusable, while document availability and generation logic stay centralized and project-type-driven.

**Primary recommendation:** Use a shared `GeneratedDocument` model backed by Tiptap JSON, export PDF through Playwright on the server, export DOCX through `docx`, and keep all document availability rules in one project-type mapping layer.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tiptap/react` | `3.20.3` | In-app rich-text editor | Mature ProseMirror-based editor with React support and JSON/HTML output |
| `@tiptap/starter-kit` | `3.20.3` | Base nodes/marks for editor | Fastest path to a simple, extensible editor without hand-rolling commands |
| `@tiptap/pm` | `3.20.3` | ProseMirror peer package set | Required for stable Tiptap runtime/editing behavior |
| `@tiptap/static-renderer` | `3.20.3` | Render stored editor JSON without mounting an editor | Lets exports render from the same canonical document state |
| `docx` | `9.6.1` | Programmatic DOCX generation | Standard TS/JS library for real Word documents and packaging |
| `playwright` | `1.58.2` | Server-side PDF rendering via Chromium | Reliable pagination/print output for polished PDFs from HTML templates |

Version verification: verified locally on 2026-03-16 with `npm view <package> version time --json`.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | existing repo: `4.3.6` | Document payload validation | Use for export request bodies and generated document records |
| `vitest` | existing repo: `4.1.0` | Unit/integration testing | Reuse current test stack for document generators and route handlers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tiptap | Lexical or Slate | Viable, but adds unnecessary divergence from common ProseMirror export tooling |
| Playwright PDF | `@react-pdf/renderer` | Better when authoring a separate PDF-only layout tree; worse when export must track editable rich text exactly |
| `docx` | HTML-to-DOCX converters | Faster initially, but less controllable for screenplay/professional formatting and section metadata |

**Installation:**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm @tiptap/static-renderer docx playwright
npx playwright install chromium
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
|-- app/
|   |-- api/documents/generate/    # Generate outline/treatment/proposal drafts
|   |-- api/export/pdf/            # Return PDF bytes
|   `-- api/export/docx/           # Return DOCX bytes
|-- components/document-workspace/ # Tabs, editor, preview, export controls
|-- lib/documents/
|   |-- availability.ts            # Which document types each project type supports
|   |-- types.ts                   # GeneratedDocument, DocumentKind, ExportFormat
|   |-- generators/                # AI prompt + normalization per document type
|   |-- exporters/                 # pdf/docx adapters
|   |-- templates/                 # HTML + DOCX formatting helpers
|   `-- citations.ts               # Quote anchor/label mapping
`-- lib/types/project-types.ts     # Stays the source of project-type identity
```

### Pattern 1: Canonical Document Record
**What:** Every generated/exportable artifact should be represented as one typed record with metadata plus editable rich-text content.
**When to use:** For report export, outline generation, treatment generation, and strategic-summary/proposal generation.
**Example:**
```typescript
type DocumentKind = 'report' | 'outline' | 'treatment' | 'proposal';

interface GeneratedDocument {
  id: string;
  kind: DocumentKind;
  projectType: string;
  title: string;
  writtenBy: string;
  createdAt: string;
  cover: {
    typeLabel: string;
    dateLabel: string;
  };
  content: Record<string, unknown>; // Tiptap JSON
  quoteRefs: Array<{ id: string; label: string }>;
}
```

### Pattern 2: Shared-State Export Pipeline
**What:** Export from stored document state, not from the live report DOM.
**When to use:** Always. This is the only way to guarantee that the edited version is what gets exported.
**Example:**
```typescript
// Source: https://tiptap.dev/docs/editor/api/editor#getjson
const documentJson = editor.getJSON();

// Persist `documentJson`, then hand it to:
// 1. HTML renderer -> Playwright PDF
// 2. DOCX builder -> Word export
```

### Pattern 3: Dedicated Export Templates
**What:** PDF and DOCX should use format-aware templates fed by the same document state and metadata.
**When to use:** For cover pages, screenplay formatting, and non-interactive quote labels.
**Example:**
```typescript
function getLayoutProfile(kind: DocumentKind, projectType: string) {
  if (projectType === 'narrative' || projectType === 'tv-episodic') {
    return kind === 'report' ? 'coverage-report' : 'screenplay-document';
  }

  return 'professional-document';
}
```

### Anti-Patterns to Avoid
- **Exporting the current UI DOM:** The current `analysis-report.tsx` card layout is not a document template.
- **Separate editor state per export format:** PDF and DOCX must derive from the same stored content.
- **Project-type logic split across components:** Keep availability and document naming in one shared module.
- **Client-only PDF generation:** This drifts on pagination, fonts, and print fidelity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich-text editing | Custom contenteditable toolbar/editor | Tiptap | Editor edge cases are deep and expensive |
| PDF pagination | DOM screenshot or manual page splitter | Playwright Chromium PDF | Real print CSS and pagination support |
| DOCX packaging | Raw OOXML zip writer | `docx` | WordprocessingML packaging is brittle |
| Quote jump mapping | Ad hoc string search on click | Stable quote IDs/labels | Edits will break plain-text offset matching |

**Key insight:** The custom logic in this phase should be document semantics and formatting rules, not editor internals or file-format serialization.

## Common Pitfalls

### Pitfall 1: Export Drift
**What goes wrong:** The on-screen edited document and the exported file do not match.
**Why it happens:** The app exports from analysis data or UI DOM instead of saved editor state.
**How to avoid:** Persist one canonical document JSON payload and export only from that payload.
**Warning signs:** Users can change text in-app but exported files still show the original generation.

### Pitfall 2: Low-Fidelity PDF Output
**What goes wrong:** PDFs look like screenshots, have broken pagination, or lose typography.
**Why it happens:** Browser-only PDF hacks or canvas-based exporters are used.
**How to avoid:** Render export HTML on the server and print it with Playwright Chromium.
**Warning signs:** Cropped pages, blurry text, inconsistent margins, broken cover-page breaks.

### Pitfall 3: DOCX and PDF Follow Different Formatting Rules
**What goes wrong:** PDF looks polished, DOCX looks generic or structurally different.
**Why it happens:** Each export path is implemented independently with no shared layout profile.
**How to avoid:** Introduce shared document metadata and layout profiles before writing exporters.
**Warning signs:** Missing cover page in one format, different headings, quote labels only in one format.

### Pitfall 4: Quote References Break After Editing
**What goes wrong:** In-app jump links or exported quote labels no longer correspond to the right material.
**Why it happens:** References are derived from raw string offsets that shift during editing.
**How to avoid:** Store stable quote IDs and rendered labels separately from visible body text.
**Warning signs:** Clicking a quote jumps to the wrong place after a paragraph edit.

### Pitfall 5: Phase 3 Coupling Bleeds Into Phase 4
**What goes wrong:** Export logic becomes blocked on unfinished project-type analysis code.
**Why it happens:** Generation/export logic is hardcoded to current documentary output.
**How to avoid:** Separate document availability/generation contracts from current analysis implementation.
**Warning signs:** `if (projectType !== 'documentary')` patterns are copied into new document code.

## Code Examples

Verified patterns from official sources:

### Tiptap Editor State
```typescript
// Source: https://tiptap.dev/docs/editor/api/editor#getjson
const editor = useEditor({
  extensions: [StarterKit],
  content: initialContent,
});

const json = editor?.getJSON();
const html = editor?.getHTML();
```

### Static Rendering for Export
```typescript
// Source: https://tiptap.dev/docs/editor/api/utilities/static-renderer
import { renderToHTMLString } from '@tiptap/static-renderer/pm/html';

const html = renderToHTMLString({
  extensions,
  content: documentJson,
});
```

### DOCX File Output
```typescript
// Source: https://docx.js.org/api/classes/Packer.html
import { Document, Packer, Paragraph, TextRun } from 'docx';

const file = new Document({
  sections: [{
    children: [
      new Paragraph({
        children: [new TextRun({ text: title, bold: true })],
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(file);
```

### PDF Rendering with Playwright
```typescript
// Source: https://playwright.dev/docs/api/class-page#page-pdf
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle' });
const pdf = await page.pdf({
  format: 'Letter',
  printBackground: true,
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Exporting a rendered app screen | Exporting from canonical editor/document state | Current standard | Prevents UI/export drift |
| jsPDF/html2canvas PDF hacks | Chromium print-to-PDF | Current standard | Better typography, page breaks, cover pages |
| HTML string as sole source of truth | Structured editor JSON + static rendering | Current standard | Safer editing, rendering, and transformations |

**Deprecated/outdated:**
- `contenteditable` + `document.execCommand`: outdated basis for serious editing workflows.
- Screenshot-style PDF export: not acceptable for professional deliverables.
- Raw OOXML assembly: unnecessary risk when `docx` exists.

## Open Questions

1. **How strict does screenplay formatting need to be for narrative and TV exports?**
   - What we know: it must be screenplay-style where applicable.
   - What's unclear: whether the planner should target full screenplay pagination/indentation rules or a lighter studio-style approximation for v1.
   - Recommendation: define one concrete screenplay export preset in Wave 0 and test against that preset.

2. **What inputs should derivative generation consume?**
   - What we know: outlines/treatments/proposals are generated from uploaded material, and quote references should point back to the report/document.
   - What's unclear: whether generation should consume raw parsed text only, analysis only, or both.
   - Recommendation: design the generation route to accept both parsed source text and current analysis payload.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.0` |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OUTP-02 | Export report document as PDF | integration | `npx vitest run src/app/api/export/__tests__/pdf.route.test.ts` | No - Wave 0 |
| OUTP-02 | Export report document as DOCX | integration | `npx vitest run src/app/api/export/__tests__/docx.route.test.ts` | No - Wave 0 |
| OUTP-03 | Generate project-type-appropriate derivative documents | integration | `npx vitest run src/app/api/documents/generate/__tests__/route.test.ts` | No - Wave 0 |
| OUTP-03 | Edit generated documents in-app and preserve edits for export | component | `npx vitest run src/components/__tests__/document-workspace.test.tsx` | No - Wave 0 |
| OUTP-03 | Enforce document availability by project type | unit | `npx vitest run src/lib/documents/__tests__/availability.test.ts` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/api/documents/generate/__tests__/route.test.ts` - covers OUTP-03 generation rules and request validation
- [ ] `src/app/api/export/__tests__/pdf.route.test.ts` - covers OUTP-02 PDF byte response and headers
- [ ] `src/app/api/export/__tests__/docx.route.test.ts` - covers OUTP-02 DOCX byte response and headers
- [ ] `src/components/__tests__/document-workspace.test.tsx` - covers tabs, editor interactions, and export action visibility
- [ ] `src/lib/documents/__tests__/availability.test.ts` - covers project-type document matrix
- [ ] `src/lib/documents/__tests__/docx-export.test.ts` - covers cover page, headings, and quote-label preservation
- [ ] `src/lib/documents/__tests__/pdf-template.test.ts` - covers export HTML/template selection and layout profile selection

*(If no gaps: "None - existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- Tiptap editor API - JSON/HTML output and editor state: https://tiptap.dev/docs/editor/api/editor
- Tiptap static renderer utility: https://tiptap.dev/docs/editor/api/utilities/static-renderer
- Playwright `page.pdf()` API: https://playwright.dev/docs/api/class-page#page-pdf
- React PDF docs, reviewed as alternative only: https://react-pdf.org/
- `docx` API docs (`Document`, `Packer`): https://docx.js.org/api/
- Package versions verified locally with npm registry CLI on 2026-03-16:
  - `npm view @tiptap/react version time --json`
  - `npm view @tiptap/starter-kit version time --json`
  - `npm view @tiptap/pm version time --json`
  - `npm view @tiptap/static-renderer version time --json`
  - `npm view docx version time --json`
  - `npm view playwright version time --json`

### Secondary (MEDIUM confidence)
- None needed beyond official docs and registry verification.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - official docs plus npm registry verification
- Architecture: MEDIUM - official APIs are verified, but repo integration depends on Phase 3 completion and exact screenplay-format scope
- Pitfalls: HIGH - strongly supported by standard editor/export patterns and the current repo structure

**Research date:** 2026-03-16
**Valid until:** 2026-04-15
