# Roadmap: FilmIntern

## Overview

FilmIntern delivers a personal filmmaking analysis tool through four phases: first a complete vertical slice proving the core value loop (upload transcript, select documentary, get analysis), then file format support for screenplays, then analysis expansion across all five project types, and finally export and document generation. Each phase delivers a usable capability increment. The vertical slice strategy front-loads risk validation (does the analysis actually help?) before investing in format parsing and additional project types.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Vertical Slice** - Complete end-to-end pipeline for documentary project type with plain text upload (completed 2026-03-17)
- [x] **Phase 2: File Format Support** - PDF, Final Draft, and DOCX parsing with structure preservation (completed 2026-03-17)
- [x] **Phase 3: Analysis Expansion** - All remaining project type analyses (corporate, narrative, TV, short-form) (completed 2026-03-17)
- [x] **Phase 3.1: Multi-Provider AI Support** - Global settings for Anthropic, OpenAI, and Ollama provider selection (completed 2026-03-17)
- [x] **Phase 4: Export and Document Generation** - Downloadable reports and treatment/outline generation (completed 2026-03-17)

## Phase Details

### Phase 1: Vertical Slice
**Goal**: User can upload a plain text transcript, select "documentary" as project type, and receive a structured interview mining analysis displayed on screen
**Depends on**: Nothing (first phase)
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, PARSE-01, ANLYS-01, OUTP-01
**Success Criteria** (what must be TRUE):
  1. User can select "documentary" from a list of project types before uploading
  2. User can upload a plain text file via drag-and-drop or file picker and see a parsed content preview
  3. User can trigger analysis and receive a structured documentary report with extracted quotes, recurring themes, and key moments
  4. Analysis report displays on screen in a professional, scannable format (not raw chatbot text)
  5. The full loop (select type, upload, preview, analyze, view report) works end-to-end without errors on a real transcript
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md - Scaffold Next.js project, foundation types/schemas/parser, app shell layout
- [x] 01-02-PLAN.md - Upload flow with drag-and-drop dropzone, server-side parsing, content preview
- [x] 01-03-PLAN.md - Streaming analysis pipeline with Claude and structured report display

### Phase 2: File Format Support
**Goal**: User can upload PDF screenplays, Final Draft (.fdx) files, and Word documents with structural formatting preserved for downstream analysis
**Depends on**: Phase 1
**Requirements**: PARSE-02, PARSE-03, PARSE-04
**Success Criteria** (what must be TRUE):
  1. User can upload a PDF screenplay and see scene headings, character names, and dialogue correctly identified in the parsed preview
  2. User can upload a Final Draft (.fdx) file and see its structure (scenes, characters, dialogue) preserved in the parsed preview
  3. User can upload a .docx file and see its content correctly parsed in the preview
  4. File type validation rejects unsupported formats with a clear error message
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md - Infrastructure: install deps, async registry with Buffer support, upload route binary handling, dropzone/project-type MIME expansion, Wave 0 test stubs
- [x] 02-02-PLAN.md - Parsers: PDF with screenplay detection, FDX XML parsing, DOCX extraction, registry wiring

### Phase 3: Analysis Expansion
**Goal**: All five project types produce tailored, high-quality analysis using project-type-specific analytical frameworks
**Depends on**: Phase 2
**Requirements**: ANLYS-02, ANLYS-03, ANLYS-04, ANLYS-05, ANLYS-06
**Success Criteria** (what must be TRUE):
  1. Corporate interview projects produce key messaging analysis with usable soundbites, quote extraction, and messaging themes
  2. Narrative film projects produce both story structure analysis (act breaks, turning points, pacing) and script coverage (character, conflict, dialogue, marketability)
  3. TV/episodic projects produce episode arc and series structure analysis
  4. Short-form/branded projects produce pacing, messaging effectiveness, and CTA clarity analysis
  5. Each project type's analysis reads as domain-appropriate professional feedback, not generic AI summary
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Schemas, prompts, and API route routing for all 4 new project types
- [x] 03-02-PLAN.md — Report components (Narrative/TV tabbed, Corporate/Short-form single-section) and page refactoring
- [x] 03-03-PLAN.md — Human verification of all 5 project types end-to-end

### Phase 03.1: Multi-Provider AI Support (INSERTED)

**Goal:** User can select AI provider (Anthropic, OpenAI, or Ollama) from a global settings page and the analysis pipeline uses that provider dynamically
**Requirements**: MPAI-01, MPAI-02, MPAI-03, MPAI-04, MPAI-05
**Depends on:** Phase 3
**Success Criteria** (what must be TRUE):
  1. User can navigate to a Settings page from the sidebar and select an AI provider
  2. User can configure provider-specific settings (model name, Ollama base URL)
  3. Analysis route uses the selected provider instead of hardcoded Anthropic
  4. Missing or invalid provider configuration shows clear error messages
  5. Default behavior (Anthropic claude-sonnet-4-5) works unchanged when no settings configured
**Plans:** 3/3 plans complete

Plans:
- [x] 03.1-01-PLAN.md — Install deps, settings persistence (types/read/write), provider registry, settings API route
- [x] 03.1-02-PLAN.md — Settings page UI with provider selection form, sidebar navigation wiring
- [x] 03.1-03-PLAN.md — Integrate analyze route with provider registry, update tests, human verification

### Phase 4: Export and Document Generation
**Goal**: User can download analysis reports and generate derivative documents (treatments, outlines) from uploaded material
**Depends on**: Phase 3
**Requirements**: OUTP-02, OUTP-03
**Success Criteria** (what must be TRUE):
  1. User can download any analysis report as a formatted PDF or DOCX document
  2. User can generate a treatment or narrative outline from uploaded material and view it on screen
  3. Downloaded documents are professionally formatted with appropriate headings, sections, and typography
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md - Establish shared document contracts, project-type availability rules, and generic analysis-report normalization
- [ ] 04-02-PLAN.md - Build derivative document generation route plus tabbed in-app editing workspace
- [ ] 04-03-PLAN.md - Implement shared export contracts, layout/renderers, and PDF/DOCX exporter libraries
- [ ] 04-04-PLAN.md - Expose export API routes and wire active-tab download handling

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 3.1 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Vertical Slice | 3/3 | Complete   | 2026-03-17 |
| 2. File Format Support | 2/2 | Complete    | 2026-03-17 |
| 3. Analysis Expansion | 3/3 | Complete   | 2026-03-17 |
| 3.1. Multi-Provider AI | 3/3 | Complete | 2026-03-17 |
| 4. Export and Document Generation | 6/6 | Complete   | 2026-03-17 |
