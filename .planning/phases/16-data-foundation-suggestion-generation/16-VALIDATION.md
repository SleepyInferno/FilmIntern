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
| 16-01-T0 | 16-01 | 1 | SUGG-01..SUGG-06 | unit stubs | `npx vitest run src/lib/__tests__/suggestions.test.ts src/app/api/projects/__tests__/suggestions-route.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 16-01-T1 | 16-01 | 1 | SUGG-04, SUGG-06 | type | `npx tsc --noEmit` | — | ⬜ pending |
| 16-01-T2 | 16-01 | 1 | SUGG-02, SUGG-05 | type | `npx tsc --noEmit` | — | ⬜ pending |
| 16-02-T1 | 16-02 | 2 | SUGG-01, SUGG-03 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 16-02-T2 | 16-02 | 2 | SUGG-01, SUGG-03, SUGG-04 | type | `npx tsc --noEmit` | — | ⬜ pending |
| 16-02-T3 | 16-02 | 2 | SUGG-01..SUGG-06 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/suggestions.test.ts` — stubs for SUGG-02 (weakness extraction), SUGG-04 (count/slice), SUGG-05 (all 4 project types), SUGG-06 (DB CRUD round-trip)
- [ ] `src/app/api/projects/__tests__/suggestions-route.test.ts` — stubs for SUGG-01 (POST triggers generation), SUGG-03 (NDJSON streaming), SUGG-06 (GET loads persisted suggestions)

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
