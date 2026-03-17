---
phase: 3
slug: analysis-expansion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
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
| 3-W0-01 | W0 | 0 | ANLYS-02 | unit | `npx vitest run src/lib/ai/schemas/__tests__/corporate.test.ts -x` | ❌ W0 | ⬜ pending |
| 3-W0-02 | W0 | 0 | ANLYS-03, ANLYS-04 | unit | `npx vitest run src/lib/ai/schemas/__tests__/narrative.test.ts -x` | ❌ W0 | ⬜ pending |
| 3-W0-03 | W0 | 0 | ANLYS-05 | unit | `npx vitest run src/lib/ai/schemas/__tests__/tv-episodic.test.ts -x` | ❌ W0 | ⬜ pending |
| 3-W0-04 | W0 | 0 | ANLYS-06 | unit | `npx vitest run src/lib/ai/schemas/__tests__/short-form.test.ts -x` | ❌ W0 | ⬜ pending |
| 3-W0-05 | W0 | 0 | ANLYS-02..06 | unit | `npx vitest run src/app/api/analyze/__tests__/route.test.ts -x` | ✅ needs update | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/ai/schemas/__tests__/corporate.test.ts` — stubs for ANLYS-02
- [ ] `src/lib/ai/schemas/__tests__/narrative.test.ts` — stubs for ANLYS-03, ANLYS-04
- [ ] `src/lib/ai/schemas/__tests__/tv-episodic.test.ts` — stubs for ANLYS-05
- [ ] `src/lib/ai/schemas/__tests__/short-form.test.ts` — stubs for ANLYS-06
- [ ] Update `src/app/api/analyze/__tests__/route.test.ts` — verify routing dispatches correct schema/prompt for all 5 project types

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Analysis output uses authentic domain vocabulary | All ANLYS-* | Subjective quality; no automated assertion | Load each project type, run analysis, verify output reads as professional domain feedback, not generic AI summary |
| Short-form sub-type toggle drives correct prompt lens | ANLYS-06 | UI interaction + output quality | Toggle commercial/social/promo sub-types, verify analysis reflects the correct lens |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
