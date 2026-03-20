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

## Milestone: v2.0 — Docker Containerization

**Shipped:** 2026-03-20
**Phases:** 5 | **Plans:** 8 | **Commits:** 52

### What Was Built
- Three-stage multi-stage Dockerfile (deps/builder/runner) with node:22-bookworm-slim, non-root user (uid 1001), and HEALTHCHECK at /api/health
- One-command dev environment via Docker Compose with HMR (WATCHPACK_POLLING), SQLite volume persistence, and Ollama host-gateway connectivity
- Caddy reverse proxy on port 7430 (HTTP, LAN-only) with flush_interval -1 for SSE streaming — no gzip
- GitHub Actions CI/CD pipeline pushing to GHCR with SHA + latest tags and BuildKit GHA caching
- Comprehensive Unraid deployment guide (docs/unraid-deployment.md) with inline compose and Caddyfile
- Phase 14 gap closure: corrected PROD-01 docs, fixed health API response example, added OLLAMA_BASE_URL to prod compose, published README.md

### What Worked
- **Milestone audit catching a real gap**: `/gsd:audit-milestone` surfaced the missing OLLAMA_BASE_URL in docker-compose.prod.yml — Phase 14 was added to close it. Same pattern as v1.0.
- **Infrastructure phases are quick**: All 8 plans executed efficiently (~1-3 min each). Infrastructure work with clear acceptance criteria parallelizes well.
- **HTTP-only Caddy decision**: Dropping "automatic HTTPS" early and locking it in CONTEXT.md prevented scope creep. The Caddyfile is 9 lines.
- **bookworm-slim acceptance**: Documenting the Alpine rejection reason (SIGILL on musl libc) in the deviation prevented revisiting the same decision later.
- **GITHUB_TOKEN for GHCR**: Zero-friction CI setup — no PAT management needed for same-repo pushes.

### What Was Inefficient
- **ROADMAP.md Phase 11 plan checkboxes**: Plans 11-01 and 11-02 shipped `[ ]` instead of `[x]` — caught during milestone audit. Small but avoidable.
- **Phase 14 as gap closure**: Documentation inconsistencies (HTTPS wording, health key) should ideally have been caught earlier. The audit workflow caught them, but they required a full extra phase.
- **Nyquist VALIDATION.md files**: All 5 phases have incomplete validation. Infrastructure-heavy milestones don't lend themselves to automated Nyquist coverage — human runtime verification is inherent. Consider lighter validation approach for pure infra phases.
- **Phase 14 executed without GSD tracking artifacts**: No PLAN.md was created for Phase 14 — it was driven by audit findings. Works fine but creates a documentation gap in the execution trail.

### Patterns Established
- **Env var fallback chain**: saved value > env var > default constant (established for OLLAMA_BASE_URL, applied to all configurable settings)
- **Three-stage Dockerfile pattern**: deps (install) → builder (build) → runner (minimal runtime) — reusable for any Next.js app with native addons
- **flush_interval -1 + no gzip**: Required pattern for SSE streaming through Caddy — no gzip anywhere in the proxy chain
- **Anonymous volumes for isolation**: node_modules and .next as anonymous volumes in dev compose prevents host/container mismatch

### Key Lessons
1. **Milestone audit consistently catches real gaps**: Second milestone in a row where audit found a missing wiring (OLLAMA_BASE_URL in prod compose). Run audit, don't skip it.
2. **Lock scope decisions in CONTEXT.md early**: "HTTP-only, port 7430" in CONTEXT.md meant zero debate when ROADMAP/REQUIREMENTS still said "automatic HTTPS" — the locked decision won.
3. **Infrastructure milestones have inherent human-only verification**: Docker HMR, SQLite persistence, Ollama connectivity, live CI runs — these cannot be fully automated. Accept it, document it, ship.
4. **Document the rejected alternative**: bookworm-slim vs Alpine. The rejection reason (SIGILL on musl) is as important as the decision — prevents re-investigation.

### Cost Observations
- Model mix: primarily sonnet (execution + verification), sonnet for integration checker
- Sessions: 52 commits in ~1 day
- Notable: Infrastructure phases executed very fast — acceptance criteria were concrete and verifiable by file inspection

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 10 | 29 | First milestone — established vertical slice + decimal phase insertion patterns |
| v2.0 | 5 | 8 | Infrastructure milestone — established Docker/CI patterns; audit again caught real gap |

### Cumulative Quality

| Milestone | LOC | Tech Stack |
|-----------|-----|------------|
| v1.0 | ~14,750 TypeScript | Next.js 15, AI SDK 6, SQLite, shadcn/ui |
| v2.0 | ~22,000 TypeScript (+7,250) | + Docker, Caddy, GitHub Actions, GHCR |

### Top Lessons (Verified Across Milestones)

1. Validate core value loop in Phase 1 before expanding scope
2. Run `/gsd:audit-milestone` before closing — consistently catches gaps (2/2 milestones)
3. Lock scope changes in CONTEXT.md early — beats stale ROADMAP/REQUIREMENTS wording every time
