---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: Script Improvement
status: unknown
stopped_at: Completed 16-02-PLAN.md
last_updated: "2026-03-23T14:37:38.928Z"
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 4
  completed_plans: 4
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Upload your material, pick your project type, get a structured analysis back — one tool that replaces hours of manual review across scattered apps.
**Current focus:** Phase 16 — data-foundation-suggestion-generation

## Current Position

Phase: 16 (data-foundation-suggestion-generation) — COMPLETE
Plan: 2 of 2 (all complete)

## Performance Metrics

**Velocity (from v1.0 + v2.0):**

- Total plans completed: 37
- Average duration: ~4.5 min
- Total execution time: ~2.8 hours

**Recent Trend (v2.0):**

- Last 6 plans: 2min, 12min, 2min, 3min, 1min, 1min
- Trend: Stable (infrastructure phases, varied complexity)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Revision: Page shell (Phase 15) built first — all v3.0 features render on the "Adjustments / Revision" page, so the container must exist before content phases
- Research: Text-span anchoring (not character offsets) for suggestion merge — prevents offset drift corruption
- Research: FDX preservation layer (fast-xml-parser preserveOrder:true) must be built before any export work
- Research: Single batched generateObject call (not per-weakness) — 17x token reduction
- Research: Single source of truth state model for suggestions — document preview always derived via useMemo
- Research: diff-match-patch-es as only new dependency — remove unused Tiptap packages
- Research: Standalone "Adjustments / Revision" page (new Next.js route), not a tab in existing workspace
- 15-02: Revision page fetches project data independently from API, not from workspace context
- 16-01: Added fdxSource to UploadData interface in workspace-context.tsx for type-safe client propagation
- 16-01: Used double type assertion for fdxSource on ParseResult in upload route (ParseResult lacks index signature)
- [Phase 16]: Added critic analysis source toggle allowing users to generate suggestions from either standard or critic analysis
- [Phase 16]: Rewrote suggestion prompts with professional screenwriter voice for higher quality output

### Pending Todos

None yet.

### Blockers/Concerns

- Host directory permissions for SQLite volume mount (uid 1001) need first-run documentation
- Ollama host connectivity requires extra_hosts config on Linux Docker (works natively on Docker Desktop)

## Session Continuity

Last session: 2026-03-23T14:37:38.925Z
Stopped at: Completed 16-02-PLAN.md
Resume file: None
