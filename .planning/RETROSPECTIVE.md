# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-19
**Phases:** 10 (including 1 inserted decimal phase) | **Plans:** 29 | **Commits:** 194

### What Was Built
- Full upload-to-analysis pipeline for 4 project types (documentary, narrative, corporate, TV/episodic) with project-type-specific structured output
- Multi-format file parsing: PDF with screenplay detection, Final Draft (.fdx), DOCX, plain text
- Multi-provider AI support via provider registry (Anthropic, OpenAI, Ollama) with global settings UI and health-check
- PDF/DOCX export of analysis reports + derivative document generation (treatments, outlines)
- Card-based evaluation workspaces replacing flat report output — unique dimension cards per project type
- Auto-save library with SQLite persistence, sidebar filter, open/delete saved analyses
- Provider health-check with graceful error messages replacing raw 500s
- Harsh Critic Mode: industry executive analysis lens (optional, sequential, non-fatal failure) on any project type

### What Worked
- **Vertical slice strategy**: Validating the core value loop (upload → analyze → report) in Phase 1 before expanding formats or project types kept scope disciplined
- **Phase granularity**: 3–6 plans per phase hit a good size — each plan was independently completable but phases stayed coherent
- **Provider registry pattern**: Decoupling provider selection from analysis logic made adding Ollama/OpenAI clean with no analysis route changes
- **Card-based workspace decision**: Upgrading from flat text output to evaluation dimension cards was the right call — significant UX improvement shipped as its own phase
- **Decimal phase insertion (3.1)**: Multi-provider support was inserted mid-milestone cleanly without renumbering
- **Critic as non-fatal sequential call**: Standard analysis is saved before critic streaming begins — failure doesn't lose the user's work
- **GSD milestone audit before close**: Audit caught the MPAI-05 provider error handling gap (Phase 8) and CRIT-01 missing (Phase 9) before archiving — resulted in 2 gap-closure phases being added

### What Was Inefficient
- **Short-form/branded type**: Carried through Phases 3–5 as a project type then removed in Phase 6 — left orphaned workspace components and dead code
- **ROADMAP progress table drift**: Progress table in ROADMAP.md became stale (Phase 9 showed "Not started" despite SUMMARY.md files existing) — tooling gap
- **harshCriticEnabled as local state**: Critic toggle resets on project load — visual state is misleading since saved critic data loads correctly. Minor but creates confusion
- **Test environment gaps**: WorkspaceContext not injected in Phase 4 tests (pre-existing), settings localStorage mock failures — these accumulated as known debt rather than being fixed inline

### Patterns Established
- **Workspace card pattern**: `EvaluationCard` + `WorkspaceHeader` + `WorkspaceGrid` as shared primitives — all project types use this consistently
- **`ready=true` for optional card content**: Cards with optional data use `ready=true` so fallback text renders inside the card children rather than triggering skeleton state
- **TDD for backend, integration-first for frontend**: Phase 9 and 8 used failing tests before implementation for backend; frontend phases wired end-to-end without mocking internal state
- **Health-check before analysis call**: Provider validation before the analysis API call makes error messages actionable rather than cryptic

### Key Lessons
1. **Validate the core loop first, then layer on top**: The vertical slice strategy proved correct — every subsequent phase built on a proven foundation
2. **Remove scope early or carry the full cost**: Short-form/branded was tentative from Phase 3 onward; removing it in Phase 6 left orphaned code that required cleanup
3. **Gap audit before milestone close is high-value**: `/gsd:audit-milestone` caught 2 real gaps (provider errors, critic mode) that would have been unfinished work
4. **Local-first SQLite needs no backend**: Zero infrastructure overhead for single-user tool — better-sqlite3 is fast enough for all use cases here
5. **Prose streaming (no schema) works better for critic output**: Harsh critic is 10 sections of prose — attempting to Zod-type it would have added complexity with no benefit

### Cost Observations
- Model mix: primarily sonnet (execution), opus for planning/architecture decisions
- Sessions: ~194 commits across 3 days
- Notable: GSD phased execution kept context fresh — no single session bloated to unmanageable size

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 10 | 29 | First milestone — established vertical slice + decimal phase insertion patterns |

### Cumulative Quality

| Milestone | LOC | Tech Stack |
|-----------|-----|------------|
| v1.0 | ~14,750 TypeScript | Next.js 15, AI SDK 6, SQLite, shadcn/ui |

### Top Lessons (Verified Across Milestones)

1. Validate core value loop in Phase 1 before expanding scope
2. Run `/gsd:audit-milestone` before closing — consistently catches gaps
