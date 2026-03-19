# Phase 4: Export and Document Generation - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers downloadable analysis documents plus generated derivative documents from uploaded material. Users can export analysis outputs as formatted PDF or DOCX files, generate outlines for every project type, generate treatments for narrative and TV/episodic projects, generate strategic summary/proposal-style documents for documentary and corporate projects, edit generated documents in-app, and export the edited result.

</domain>

<decisions>
## Implementation Decisions

### Export Controls
- Export should use one primary action in the report header area with a format dropdown rather than separate PDF and DOCX buttons.
- Both PDF and DOCX must be supported and selectable.
- Export actions should live in the top-right or equivalent professional action area rather than at the bottom of the page.
- Export should generate a cleaned, formatted document version rather than a literal copy of the on-screen UI.
- If delayed/background generation does not materially improve quality, use the simpler flow.

### Generated Document Types
- Every project type should offer an Outline output.
- Treatment output is only for Narrative Film and TV / Episodic projects.
- Documentary and Corporate Interview projects should generate a strategic summary/proposal-style document rather than a treatment.
- Narrative and TV outlines should support both high-level beat form and scene-by-scene structure.
- Output availability should not vary based on input file type; import support stays consistent across project types.

### Editing And Export Behavior
- Generated documents should be editable in-app before export.
- Editing should feel like a simple rich-text editor for this phase rather than a highly structured template editor.
- Export should use the edited version exactly, not the original generated draft.
- Report, outline, treatment, and proposal-style outputs should be selectable as export variants.

### Document Presentation
- Exported documents should feel like polished studio/client deliverables with strong readability.
- Visual style should stay minimal and professional rather than heavily branded.
- Exported documents should include a cover page with Title, Type, Date, and Written by.
- Narrative and TV exports should use proper screenplay-style formatting where applicable.
- Documentary and Corporate exports should use polished professional document formatting rather than screenplay formatting.

### In-App Reading Experience
- Generated documents should appear as tabs alongside the analysis report rather than in a separate workspace.
- Treatment and Outline generation should be triggered by dedicated buttons after analysis, not auto-generated.
- Quotes should be clickable in-app and jump to the relevant place in the current document/report view.
- Exported PDF and DOCX files should preserve readable quote references/labels even though they are not interactive.

### Claude's Discretion
- Exact visual styling details inside the minimal/professional direction
- Whether background generation is warranted for specific export cases
- Exact naming of strategic-summary/proposal outputs for documentary and corporate projects
- Exact tab labeling and action wording as long as the document types remain clear

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Sources
- `.planning/ROADMAP.md` - Phase 4 goal, requirement mapping, and success criteria for export/document generation
- `.planning/REQUIREMENTS.md` - Defines `OUTP-02` and `OUTP-03`
- `.planning/PROJECT.md` - Product principles including professional output quality and project-type-driven behavior
- `.planning/STATE.md` - Current milestone state and prior implementation decisions that affect Phase 4

### Existing Product Surfaces
- `src/components/analysis-report.tsx` - Current structured on-screen report that export and document tabs should align with
- `src/components/content-preview.tsx` - Existing pre-analysis document viewer patterns
- `src/app/page.tsx` - Current single-page workflow where report tabs and document actions will integrate
- `src/app/api/analyze/route.ts` - Current analysis generation entry point that future document-generation/export flows will build around
- `src/lib/types/project-types.ts` - Existing project type definitions that should drive which generated documents are offered

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/analysis-report.tsx`: Existing section-based report renderer that can anchor export variants and on-screen document tabs.
- `src/components/report-sections/*`: Modular report sections already break documentary output into reusable chunks.
- `src/components/content-preview.tsx`: Existing reading surface pattern for document-like content blocks.
- `src/components/ui/card.tsx`, `src/components/ui/button.tsx`, `src/components/ui/tabs.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/separator.tsx`: Existing UI primitives suitable for a professional tabbed document/export experience.

### Established Patterns
- `src/app/page.tsx` uses a single linear workflow: upload -> preview -> analyze -> report. Phase 4 should extend this with post-analysis document actions and tabs rather than inventing a separate app area.
- `src/components/analysis-report.tsx` is organized as labeled sections inside Cards. Export formatting can reuse this information architecture while translating it into cleaner document presentation.
- Current analysis is streamed from `src/app/api/analyze/route.ts`, so derivative document generation likely needs to layer onto the existing analysis output rather than replace it.
- Project-type behavior is centralized in `src/lib/types/project-types.ts`, which is the natural place to drive document-type availability decisions.

### Integration Points
- `src/app/page.tsx`: Add tab state and post-analysis actions for generating and editing derived documents.
- `src/components/analysis-report.tsx`: Add export controls in the top-right action area and connect report content to export variants.
- `src/app/api/analyze/route.ts` or adjacent API routes: Likely integration point for generation of treatments, outlines, and proposal-style documents.
- Future export route/utilities: Will need to convert edited rich-text/document state into PDF and DOCX outputs while preserving the chosen formatting style.

</code_context>

<specifics>
## Specific Ideas

- Export should feel like a professional studio/client workflow, not a developer utility.
- Report/document actions should remain visible in a top-right action area.
- In-app quote references should support click-to-jump behavior.
- The generated document set should include Report, Outline, Treatment, and a strategic summary/proposal-style output where appropriate by project type.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 04-export-and-document-generation*
*Context gathered: 2026-03-16*
