---
phase: 16
slug: data-foundation-suggestion-generation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 0 | SUGG-04 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | SUGG-04 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 1 | SUGG-01, SUGG-05 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 16-02-02 | 02 | 1 | SUGG-02 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 16-03-01 | 03 | 2 | SUGG-01 | e2e-manual | — | — | ⬜ pending |
| 16-03-02 | 03 | 2 | SUGG-03 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 16-04-01 | 04 | 2 | SUGG-06 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/suggestions/db.test.ts` — stubs for SUGG-04 (schema, insert, fetch)
- [ ] `src/__tests__/suggestions/extract-weaknesses.test.ts` — stubs for SUGG-05 (per-type extraction)
- [ ] `src/__tests__/suggestions/generate.test.ts` — stubs for SUGG-01, SUGG-02 (generation, structured output)
- [ ] `src/__tests__/suggestions/count.test.ts` — stubs for SUGG-03 (count selection)
- [ ] `src/__tests__/suggestions/project-types.test.ts` — stubs for SUGG-06 (all 4 project types)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Suggestions stream progressively in UI | SUGG-01 | Streaming UX requires visual inspection | Open revision page, click generate, observe suggestions appearing incrementally |
| Suggestions reference specific weaknesses (not generic advice) | SUGG-02 | Quality/relevance is subjective | Generate suggestions for a known script, verify each suggestion cites a specific weakness from analysis |
| Suggestions persist across browser reload | SUGG-04 | Requires full browser session test | Generate suggestions, close browser, reopen project, verify suggestions still visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
