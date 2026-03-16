# Project Research Summary

**Project:** FilmIntern
**Domain:** AI-powered filmmaking document analysis and creative workflow tool
**Researched:** 2026-03-16
**Confidence:** MEDIUM

## Executive Summary

FilmIntern is a single-user, personal web tool that accepts film industry documents (screenplays, transcripts, interview logs) and produces project-type-aware AI analysis using Claude's large context window. The product's core value is not the code -- it is the prompt engineering per project type. Experts build tools like this as a three-tier pipeline (upload/parse, analyze via LLM, render output) using a configuration-driven architecture where each project type selects entirely different analytical frameworks, prompts, and output schemas. The recommended stack is Next.js (App Router) with SQLite, the Anthropic SDK via Vercel AI SDK for streaming, and shadcn/ui for the interface. This is deliberately simple: no auth, no multi-user, no cloud database.

The recommended approach is to build a vertical slice first -- one project type (documentary), one file format (plain text), end-to-end through the entire pipeline -- then expand horizontally to additional project types and file formats. This proves the core value proposition ("upload, select type, get useful analysis") before investing in format support or output generation. The architecture uses a Project Type Registry pattern where adding a new project type means adding configuration and prompt files, not changing infrastructure code.

The two existential risks are (1) screenplay PDF parsing destroying formatting that downstream analysis depends on, and (2) generic prompts producing useless "book report" analysis that offers no insight beyond what a filmmaker already knows. Both are solvable but both require significant dedicated effort. PDF parsing must be tested against multiple screenplay sources before building analysis features on top. Prompt engineering should be budgeted as the single largest development effort -- plan 2-3 weeks of iteration per project type, not 1-2 days.

## Key Findings

### Recommended Stack

A lightweight, single-deployment Next.js application with local storage. No external services beyond the Anthropic API. The stack is optimized for iteration speed on prompts and minimal operational overhead.

**Core technologies:**
- **Next.js 15 (App Router):** Full-stack framework -- UI, API routes for file upload/LLM calls, streaming support. Single deployment unit.
- **TypeScript:** Non-negotiable for structured data models (project types, analysis schemas, prompt/response shapes).
- **Anthropic Claude SDK + Vercel AI SDK:** Claude for its 200K token context window (critical for full screenplays). Vercel AI SDK for streaming UI integration via `streamText`/`useChat`.
- **SQLite via Drizzle ORM:** Zero-config local database for project metadata and analysis history. No Postgres, no cloud DB.
- **Tailwind CSS + shadcn/ui:** Fast iteration, owned components, no design system overhead.
- **pdf-parse + mammoth:** Server-side file parsing for PDF and DOCX. FDX (Final Draft XML) via custom XML parser.
- **React-PDF + docx:** Client-side PDF and DOCX generation for downloadable reports.

**What NOT to use:** No auth (NextAuth), no cloud DB (Supabase/Firebase), no Redis, no LangChain, no client-side state management libraries, no monorepo tooling.

### Expected Features

**Must have (table stakes):**
- File upload supporting PDF, plain text, and FDX (Final Draft) formats
- Project type selection that drives the entire analysis pipeline
- Structured analysis report output that looks professional, not like chatbot text
- Story structure analysis for narrative projects (3-act, Save the Cat, Hero's Journey)
- Character analysis for narrative projects
- Quote/moment extraction for documentary/interview projects
- Theme identification across all project types
- Export/download as PDF; copy-paste friendly output

**Should have (differentiators):**
- Project-type-aware analysis routing (the core differentiator -- no competitor does this)
- Full script coverage report in professional format (logline, synopsis, analysis sections, rating)
- Interview mining with categorization by topic/emotion/narrative usefulness
- Dialogue quality assessment (voice distinctiveness, naturalness)
- Short-form/branded content analysis (underserved market niche)

**Defer (v2+):**
- Treatment/outline generation from raw material (high complexity, different problem than analysis)
- Production planning outputs (shot lists, schedules -- requires scene detection, location extraction)
- Pacing visualization (charts showing scene intensity over time)
- Built-in transcription, script editing, AI rewrite suggestions, video/audio handling, collaboration, mobile optimization

### Architecture Approach

A three-tier pipeline: Upload and Parse --> Analyze (LLM) --> Generate Output. Each tier has clear boundaries. The key architectural pattern is configuration-driven: a Project Type Registry maps each project type to accepted file formats, analysis prompts, output schemas, and templates. Adding a new project type means adding config and prompts, not modifying infrastructure. File parsing normalizes all input formats to plain text (Parse Once, Analyze Many). LLM analysis uses multi-pass focused prompts rather than one giant prompt, with Zod schema validation on every response. Results display progressively as each analysis pass completes.

**Major components:**
1. **File Parser Layer** -- Normalizes PDF, FDX, plain text into structured text. Parser registry pattern with one module per format.
2. **Project Type Registry** -- Configuration objects mapping project types to file types, prompts, and output templates. The "brain" of the app.
3. **Prompt Assembler** -- Combines extracted text with project-type-specific prompt templates. Each prompt targets one analytical dimension.
4. **LLM Client** -- Thin wrapper around Anthropic SDK. Handles streaming, retries, token counting, cost tracking. No LangChain.
5. **Report Renderer** -- React components that map structured JSON analysis to professional-looking report sections. Progressive display.
6. **Document Generator** -- Server-side PDF/DOCX generation for downloadable reports, treatments, shot lists.

### Critical Pitfalls

1. **Screenplay PDF parsing destroys formatting** -- Positional formatting (centered character names, indented dialogue) is flattened to a text stream. Prevention: support FDX as first-class format; use spatial-aware PDF extraction; show parsed structure preview to user before analysis runs.

2. **Generic prompts produce useless "book report" analysis** -- Without professional analytical frameworks embedded in prompts, output is vague and unhelpful. Prevention: embed industry frameworks (script coverage structure, interview mining methodology) per project type; require the LLM to cite specific passages with page references; use structured JSON output.

3. **Context window overflow silently truncates long documents** -- Feature screenplays run 35K-55K tokens; add prompt overhead and you risk truncation. Prevention: implement token counting; use Claude's 200K window; design chunked analysis for documents that exceed limits; explicitly prompt for middle-document content.

4. **Hallucinated quotes, scenes, and characters** -- LLMs fabricate details from the user's own work, which is immediately detected and destroys trust. Prevention: pre-extract structured data (scene list, character list, key quotes) before analysis; instruct against fabrication; consider a verification pass.

5. **All project types treated as prompt variations** -- Using one template with swapped keywords produces analysis that applies wrong frameworks to wrong project types. Prevention: design each project type's analysis pipeline independently from scratch; each type gets its own system prompt, output schema, and evaluation criteria.

## Implications for Roadmap

Based on combined research findings, here is the suggested phase structure:

### Phase 1: Foundation and Vertical Slice
**Rationale:** All three research files (FEATURES, ARCHITECTURE, PITFALLS) agree: build one complete end-to-end path first to prove the value proposition works. Start with the simplest file format (plain text) and one project type (documentary -- transcripts are plain text, avoiding PDF parsing complexity).
**Delivers:** Working pipeline: upload a plain text transcript, select "documentary" project type, get structured analysis back, view as formatted report.
**Addresses:** Project type selection, file upload (text only), AI analysis engine with project-type routing, theme identification, quote/moment extraction, structured report output.
**Avoids:** Pitfall 10 (building parser before defining output needs) by designing output schemas first and working backwards. Pitfall 2 (generic prompts) by focusing prompt quality for one type before expanding.

### Phase 2: File Format Support
**Rationale:** PDF and FDX parsing are isolated from analysis logic but foundational for narrative project types. This is where Pitfall 1 (PDF formatting destruction) must be confronted head-on. Separate this from prompt work so parsing quality can be validated independently.
**Delivers:** PDF and FDX file parsing with structural preservation. Parsed structure preview for user validation. Format detection and validation per project type.
**Addresses:** PDF screenplay parsing, FDX (Final Draft XML) parsing, file type validation, parsed structure preview.
**Avoids:** Pitfall 1 (PDF parsing garbage) by testing against 5+ PDF sources. Pitfall 7 (poor input handled silently) by showing parse preview and quality thresholds.

### Phase 3: Narrative Analysis and Additional Project Types
**Rationale:** With file formats working, expand to narrative film analysis (the "killer feature" -- full script coverage) and remaining project types. This phase IS prompt engineering -- budget it as the largest single effort.
**Delivers:** Narrative film analysis (story structure, character, dialogue), TV/episodic analysis, short-form/branded analysis, corporate interview analysis. Full script coverage report format.
**Addresses:** Story structure analysis, character analysis, script coverage report, dialogue assessment, short-form/branded analysis, interview mining with categorization.
**Avoids:** Pitfall 5 (treating project types as prompt variations) by designing each independently. Pitfall 13 (underestimating prompt iteration) by budgeting 2-3 weeks per project type.

### Phase 4: Output and Export
**Rationale:** Analysis must be working and high-quality before investing in output generation. PDF report generation, document export, and treatment/outline generation depend on stable analysis schemas.
**Delivers:** PDF report export, DOCX export, treatment/outline generation from raw material.
**Addresses:** Export/download (PDF, DOCX, markdown), treatment/outline generation, copy-paste friendly output.
**Avoids:** Pitfall 6 (output looks like chatbot text) by designing professional report templates with industry terminology and scannable formatting.

### Phase 5: Polish and Advanced Features
**Rationale:** Streaming UX, cost tracking, analysis history, and advanced features like pacing visualization require the core pipeline to be stable. These are refinements, not foundations.
**Delivers:** Streaming/progressive display, error handling and retry UX, analysis history (SQLite), cost tracking/logging, pacing visualization.
**Addresses:** Remaining differentiators and UX polish.
**Avoids:** Pitfall 3 (context overflow) and Pitfall 9 (lost in the middle) through refined chunking strategies and explicit middle-content prompts.

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** Plain text avoids PDF parsing complexity, proving the analysis pipeline works before fighting file formats. Documentary is chosen because it is the simplest project type (transcript in, analysis out) with high user value.
- **Phase 2 before Phase 3:** Narrative analysis requires FDX/PDF parsing to be reliable. Screenplay analysis on garbled input is worthless (Pitfall 1). File format support is a prerequisite.
- **Phase 3 is the largest phase:** Prompt engineering is the product's core IP. Each project type needs independent design and 2-3 weeks of iteration. This is not a coding phase -- it is a quality engineering phase.
- **Phase 4 after Phase 3:** Document generation requires stable analysis schemas as input. Building export before analysis is settled means rework.
- **Phase 5 last:** Streaming UX and history are polish that improve an already-working tool. They do not change the core value.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** PDF screenplay parsing is a known hard problem. Needs research into spatial-aware text extraction, testing against multiple screenplay PDF sources, and potentially multimodal LLM fallback for extraction.
- **Phase 3:** Prompt engineering per project type requires domain research into professional analytical frameworks (script coverage conventions, documentary editing workflow, corporate video assessment criteria). Each project type is essentially its own mini-research project.
- **Phase 4:** Treatment and outline document formats vary by project type and industry segment. Needs research into industry-standard document structures.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Standard Next.js App Router + API routes + Vercel AI SDK streaming. Well-documented, many examples available.
- **Phase 5:** Streaming UX, error handling, SQLite persistence are all well-documented patterns with established solutions.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH (choices), MEDIUM (versions) | Technology choices are well-established patterns. Exact versions need verification against npm registry before installing. |
| Features | MEDIUM | Based on training data knowledge of competitors. Competitor feature sets may have changed. Core feature needs are stable (filmmakers' workflows do not change fast). |
| Architecture | MEDIUM-HIGH | Pipeline architecture for document analysis is well-established. Configuration-driven project type routing is sound. FDX parsing approach is based on a stable XML spec. |
| Pitfalls | MEDIUM | Pitfalls are based on known LLM application patterns and domain knowledge. PDF parsing and prompt quality risks are well-documented in the community. "Lost in the middle" and hallucination risks are active research areas where mitigations evolve. |

**Overall confidence:** MEDIUM -- strong on architecture and technology choices, uncertain on exact library versions and competitor landscape. The highest-risk areas (PDF parsing quality, prompt engineering effort) are execution risks, not research gaps.

### Gaps to Address

- **FDX parser implementation:** No established npm library for FDX parsing was identified. Will need a custom XML parser. Research the exact FDX XML schema during Phase 2 planning.
- **Spatial-aware PDF text extraction:** pdf-parse does basic extraction. Positional/column-aware extraction may require pdfjs-dist with custom coordinate analysis or a different library entirely. Needs hands-on testing in Phase 2.
- **Token counting for Anthropic models:** Verify whether the Anthropic SDK provides token counting utilities or if a separate tokenizer (tiktoken) is needed. Affects Phase 1 architecture.
- **Vercel AI SDK + Anthropic provider compatibility:** Verify current integration patterns between `ai` package and `@ai-sdk/anthropic` at implementation time. SDK APIs evolve rapidly.
- **Competitor verification:** ScriptReader Pro and NolanAI feature sets should be checked during Phase 3 to ensure differentiators still hold.
- **Cost modeling:** No concrete cost estimates for per-analysis API usage. Should be estimated during Phase 1 with real document lengths to set expectations.

## Sources

### Primary (HIGH confidence)
- Next.js documentation (nextjs.org/docs) -- App Router, Route Handlers, Server Components
- Vercel AI SDK documentation (sdk.vercel.ai) -- streaming patterns, Anthropic provider
- Anthropic SDK (github.com/anthropics/anthropic-sdk-typescript) -- client usage patterns
- Drizzle ORM documentation (orm.drizzle.team) -- SQLite driver, schema definition
- Final Draft XML (FDX) format specification -- stable, well-documented XML schema

### Secondary (MEDIUM confidence)
- shadcn/ui documentation (ui.shadcn.com) -- component patterns and theming
- pdf-parse / pdf.js ecosystem -- mature library but version specifics unverified
- Competitor tool analysis (ScriptReader Pro, StudioBinder, Descript, NolanAI) -- based on training data, may be outdated
- LLM context window behavior and hallucination patterns -- active research area

### Tertiary (LOW confidence)
- Exact npm package versions -- based on training data, must verify against live registry
- Cost estimates for Claude API usage on full-length documents -- needs empirical testing
- React-PDF and docx library capabilities for complex document generation -- needs prototyping

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
