# FilmIntern

## What This Is

A personal filmmaking workflow web app that lets you select a project type (documentary, narrative film, TV/episodic, or corporate interview), upload a transcript or screenplay, and receive a structured AI analysis report tailored to that project type. Supports PDF, Final Draft (.fdx), DOCX, and plain text. Includes PDF/DOCX export, derivative document generation (treatments, outlines), a persistent library of saved analyses, multi-provider AI (Anthropic/OpenAI/Ollama), dark/light theme, card-based evaluation workspaces, and an optional Harsh Critic Mode for industry-executive-style brutal feedback. Built to replace a scattered multi-tool workflow and serve as a second set of eyes on your own work.

## Core Value

Upload your material, pick your project type, get a structured analysis back — one tool that replaces hours of manual review across scattered apps.

## Requirements

### Validated

- ✓ User can select a project type before uploading material — v1.0
- ✓ User can upload via drag & drop or file picker — v1.0
- ✓ App displays a parsed content preview before analysis runs — v1.0
- ✓ User can trigger an analysis run after upload — v1.0
- ✓ User receives a structured analysis report formatted for the project type — v1.0
- ✓ App parses plain text (.txt) files — v1.0
- ✓ App parses PDF files with screenplay structure detection — v1.0
- ✓ App parses Final Draft (.fdx) files preserving scene/character/dialogue structure — v1.0
- ✓ App parses Word/DOCX files — v1.0
- ✓ Documentary projects receive interview mining analysis (quotes, themes, key moments) — v1.0
- ✓ Corporate interview projects receive key messaging analysis (soundbites, messaging themes) — v1.0
- ✓ Narrative film projects receive story structure analysis (act breaks, pacing, arcs) — v1.0
- ✓ Narrative film projects receive script coverage (character, conflict, dialogue, marketability) — v1.0
- ✓ TV/episodic projects receive episode arc and series structure analysis — v1.0
- ✓ User can download analysis report as formatted PDF or DOCX — v1.0
- ✓ App can generate a treatment or narrative outline from uploaded material — v1.0
- ✓ User can select AI provider (Anthropic, OpenAI, Ollama) from global settings — v1.0
- ✓ Provider failures return clear error messages (not 500s) with health-check — v1.0
- ✓ User can toggle between light and dark theme — v1.0
- ✓ App applies orange/amber brand accent colors consistently in both themes — v1.0
- ✓ Theme preference persists across page refreshes — v1.0
- ✓ Narrative analysis displays as "Story Lab Workspace" with 8 evaluation dimension cards — v1.0
- ✓ Documentary analysis displays with 6 interview-specific evaluation cards — v1.0
- ✓ Corporate interview analysis displays with 6 messaging-specific cards — v1.0
- ✓ TV/Episodic analysis displays with 6 episode/series evaluation cards — v1.0
- ✓ Analyses are automatically saved to SQLite after completion — v1.0
- ✓ User can browse saved analyses in Library (sorted by date, filterable by project type) — v1.0
- ✓ User can open a saved analysis from Library — v1.0
- ✓ User can delete a saved analysis from Library — v1.0
- ✓ User can enable Harsh Critic Mode for an industry executive analysis lens alongside standard analysis — v1.0

### Active

*(empty — planning v2.0 requirements)*

### Out of Scope

- Short-form/branded project type (ANLYS-06, WORK-05) — removed in Phase 06, not needed in this application
- Multi-user collaboration — personal tool first
- Mobile app — web-first
- Real-time co-editing — not relevant to personal workflow tool
- Cloud sync of Library — personal tool, local-only
- Full-text search within analysis content — date+type filter sufficient for v1.0
- OAuth / user accounts — single user, no auth needed
- Built-in transcription — transcripts come pre-made
- AI rewriting / script editing — analysis tool, not an editor

## Context

Shipped v1.0 with ~14,750 LOC TypeScript (Next.js 15, Tailwind CSS, shadcn/ui, better-sqlite3, AI SDK 6).
Tech stack: Next.js App Router, Anthropic/OpenAI/Ollama via AI SDK 6, SQLite via better-sqlite3, PDF (pdf-parse), FDX (fast-xml-parser), DOCX (mammoth), docx + jsPDF for export, next-themes for dark/light mode.
Primary user: single filmmaker using as personal workflow tool.
Known tech debt: orphaned short-form components safe to delete, harshCriticEnabled local state resets on project load (visual only — data persists correctly), 6 pre-existing test failures in settings/narrative fixtures.

## Constraints

- **Personal use**: Single-user tool — no auth complexity needed
- **File types**: Handles transcript text files and screenplay/script formats (PDF, FDX, plain text, DOCX)
- **AI integration**: Analysis quality depends on prompt design per project type — this is core IP of the tool
- **Local-first**: SQLite on-disk, no cloud backend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Project type drives analysis | Different project types need fundamentally different analysis — one-size-fits-all produces mediocre output | ✓ Good — each type's analysis is domain-appropriate |
| Personal tool (no multi-user) | Reduces scope significantly — can add later if needed | ✓ Good — kept complexity low throughout |
| Vertical slice strategy (documentary first) | Front-loads risk validation before investing in format parsing and additional types | ✓ Good — core value loop validated in Phase 1 |
| AI SDK 6 streamText with Output.object | Structured streaming output for analysis sections | ✓ Good — enabled real-time display of structured sections |
| Progressive JSON.parse for streaming | More reliable than AI SDK React hooks for structured streaming consumption | ✓ Good — no streaming issues in production |
| SQLite via better-sqlite3 | Simple local persistence, no server required | ✓ Good — zero-config, performant for single user |
| Provider registry pattern for AI | Decoupled provider selection from analysis logic | ✓ Good — enabled clean multi-provider support in Phase 3.1 |
| Card-based workspace over flat report | Redesign from flat text output to evaluation dimension cards | ✓ Good — significant UX improvement |
| Plain text streaming for Harsh Critic | Prose-heavy output doesn't benefit from Zod schema; simpler streaming | ✓ Good — 10-section critic output works well as prose |
| Critic toggle as local state (not persisted) | Prevents accidental cost doubling on project reload | ✓ Good — clear UX: opt-in per session |
| Critic failure is non-fatal | Standard analysis already saved before critic streaming starts | ✓ Good — resilient UX |
| Short-form/branded removed in Phase 6 | Project type not needed in this application | ✓ Good — reduces scope, simplifies workspace grid |
| Decimal phase numbering (3.1, etc.) | Clear insertion semantics for urgent/inserted work | ✓ Good — unambiguous phase ordering |

---
*Last updated: 2026-03-19 after v1.0 milestone*
