---
phase: 09
slug: harsh-critic-analysis
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/app/api/analyze/critic/__tests__/route.test.ts --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/app/api/analyze/critic/__tests__/route.test.ts --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0 | CRIT-01 | unit | `npm test -- --testPathPattern="critic"` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | CRIT-01 | unit | `npm test -- --testPathPattern="critic"` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | CRIT-01 | integration | `npm test -- --testPathPattern="analyze"` | ✅ | ⬜ pending |
| 09-01-04 | 01 | 1 | CRIT-01 | unit | `npm test -- --testPathPattern="critic\|page"` | ❌ W0 | ⬜ pending |
| 09-01-05 | 01 | 1 | CRIT-01 | manual | — | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/analyze/critic/__tests__/route.test.ts` — stubs for critic route (CRIT-01)
- [ ] `src/app/api/analyze/critic/route.ts` — stub route file so tests can import

*Existing infrastructure (jest, @testing-library) covers all other requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toggle OFF: zero performance penalty, UI identical to current | CRIT-01 | Requires live browser + visual comparison | Load app, confirm toggle absent in default state, run analysis, verify timing identical |
| Critic output readable and 10 sections visible | CRIT-01 | Prose quality is human judgment | Enable toggle, run analysis, confirm all 10 sections present and readable |
| Works across all project types | CRIT-01 | Requires 4 real AI calls across doc/corp/narrative/TV | Enable toggle, test one analysis per project type |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
