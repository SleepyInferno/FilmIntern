# FilmIntern

## What This Is

A personal filmmaking workflow web app that lets you select a project type (documentary, narrative film, TV/episodic, or corporate interview), upload a transcript or screenplay, and receive a structured AI analysis report tailored to that project type. Supports PDF, Final Draft (.fdx), DOCX, and plain text. Includes PDF/DOCX export, derivative document generation (treatments, outlines), a persistent library of saved analyses, multi-provider AI (Anthropic/OpenAI/Ollama), dark/light theme, card-based evaluation workspaces, and an optional Harsh Critic Mode for industry-executive-style brutal feedback. Runs fully containerized — one-command dev startup via Docker Compose, production deployment to Unraid via Caddy reverse proxy, with automated image publishing to GHCR. Built to replace a scattered multi-tool workflow and serve as a second set of eyes on your own work. v3.0 adds AI-driven script improvement: analysis-targeted rewrite suggestions reviewed in a tracked-changes UI, with export of the revised script in PDF, DOCX, FDX, and plain text.

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
- ✓ Developer can start the app with `docker compose up` (no Node install needed) — v2.0
- ✓ Production image built via multi-stage Dockerfile (node:22-bookworm-slim, ~440MB) — v2.0
- ✓ SQLite database persists across container rebuilds via volume mount (./data:/app/data) — v2.0
- ✓ AI provider API keys and Ollama URL can be set via environment variables as defaults — v2.0
- ✓ App exposes /api/health endpoint; Docker HEALTHCHECK probes it for container liveness — v2.0
- ✓ Caddy reverse proxy configured on port 7430 (HTTP, LAN access; HTTPS deferred) — v2.0
- ✓ GitHub Actions workflow builds and pushes Docker image to GHCR on push to main — v2.0

## Current Milestone: v3.0 Script Improvement

**Goal:** After analysis runs, generate AI rewrite suggestions targeting flagged weaknesses — reviewed accept/reject per suggestion — then export the revised script in any format.

**Target features:**
- Analysis-driven rewrite suggestions (targets issues flagged in existing analysis)
- Accept/reject each suggestion in a tracked-changes style UI
- Merge accepted changes back into the original script
- Export revised script as PDF, DOCX, FDX (Final Draft), or plain text
- Works across all 4 project types (narrative, TV/episodic, documentary, corporate)

### Active

- [ ] User can generate AI rewrite suggestions from a completed analysis
- [ ] Suggestions target specific weaknesses flagged in the analysis
- [ ] User can review suggestions in a tracked-changes style UI (accept/reject per suggestion)
- [ ] Accepted suggestions are merged back into the original script
- [ ] User can export the revised script as PDF
- [ ] User can export the revised script as DOCX
- [ ] User can export the revised script as FDX (Final Draft)
- [ ] User can export the revised script as plain text
- [ ] Script improvement works for all 4 project types

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
- Multi-platform Docker image (arm64) — native addon cross-compilation is slow/fragile; linux/amd64 covers all targets
- Kubernetes / Helm charts — single-container Compose is sufficient for personal use
- HTTPS/TLS in reverse proxy — LAN-only deployment; Caddyfile swap is a one-line change when needed

## Context

Shipped v2.0 with ~22,000 LOC TypeScript (added ~7,250 LOC in containerization milestone).
Tech stack: Next.js 15 App Router, Anthropic/OpenAI/Ollama via AI SDK 6, SQLite via better-sqlite3, Docker + Docker Compose, Caddy reverse proxy, GitHub Actions CI/CD, GHCR image registry.
Deployment: Unraid NAS via docker-compose.prod.yml + Caddyfile on port 7430. Dev: docker-compose.yml on localhost:3000.
Primary user: single filmmaker using as personal workflow tool.
Known tech debt: orphaned short-form components safe to delete, harshCriticEnabled local state resets on project load (visual only — data persists correctly), 6 pre-existing test failures in settings/narrative fixtures. All v2.0 Nyquist VALIDATION.md files incomplete (infrastructure-heavy, runtime verification needed).

## Constraints

- **Personal use**: Single-user tool — no auth complexity needed
- **File types**: Handles transcript text files and screenplay/script formats (PDF, FDX, plain text, DOCX)
- **AI integration**: Analysis quality depends on prompt design per project type — this is core IP of the tool
- **Local-first**: SQLite on-disk, no cloud backend
- **Deployment target**: Unraid NAS, LAN access only — no public domain or HTTPS required

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
| node:22-bookworm-slim base (not Alpine) | better-sqlite3 and SWC/Turbopack require glibc; Alpine musl causes SIGILL | ✓ Good — ~440MB image, all features functional |
| Three-stage Dockerfile (deps/builder/runner) | Minimal runtime image — no devDependencies, no build cache in runner | ✓ Good — clean separation, standalone output works |
| HTTP-only Caddy on port 7430 | LAN-only deployment — no domain means automatic HTTPS adds complexity with no benefit | ✓ Good — simple config, streaming works without gzip |
| No gzip compression in Caddy | Caddy issue #6293: gzip buffers SSE responses, breaking streaming AI output | ✓ Good — flush_interval -1 + no gzip = streaming works |
| GITHUB_TOKEN for GHCR (no PAT) | Same-repo pushes work with built-in token; no secret management needed | ✓ Good — zero-friction CI setup |
| GHA cache mode=max | Caches all intermediate layers (deps + builder stages) for fast subsequent CI builds | ✓ Good — significant build time reduction after first run |

---
*Last updated: 2026-03-21 after v3.0 milestone start*
