---
phase: 6
slug: card-based-analysis-workspaces
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (jsdom environment) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 0 | ALL | unit | `npx vitest run src/components/workspaces/__tests__/evaluation-card.test.tsx -x` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 0 | WORK-01 | unit | `npx vitest run src/components/workspaces/__tests__/narrative-workspace.test.tsx -x` | ❌ W0 | ⬜ pending |
| 6-01-03 | 01 | 0 | WORK-02 | unit | `npx vitest run src/components/workspaces/__tests__/documentary-workspace.test.tsx -x` | ❌ W0 | ⬜ pending |
| 6-01-04 | 01 | 0 | WORK-03 | unit | `npx vitest run src/components/workspaces/__tests__/corporate-workspace.test.tsx -x` | ❌ W0 | ⬜ pending |
| 6-01-05 | 01 | 0 | WORK-04 | unit | `npx vitest run src/components/workspaces/__tests__/tv-workspace.test.tsx -x` | ❌ W0 | ⬜ pending |
| 6-01-06 | 01 | 0 | WORK-05 | unit | `npx vitest run src/components/workspaces/__tests__/short-form-workspace.test.tsx -x` | ❌ W0 | ⬜ pending |
| 6-02-01 | 02 | 1 | ALL | unit | `npx vitest run src/lib/ai/schemas/__tests__/ -x` | ✅ existing | ⬜ pending |
| 6-03-01 | 03 | 1 | WORK-01 | unit | `npx vitest run src/components/workspaces/__tests__/narrative-workspace.test.tsx -x` | ❌ W0 | ⬜ pending |
| 6-03-02 | 03 | 1 | WORK-02 | unit | `npx vitest run src/components/workspaces/__tests__/documentary-workspace.test.tsx -x` | ❌ W0 | ⬜ pending |
| 6-03-03 | 03 | 1 | WORK-03 | unit | `npx vitest run src/components/workspaces/__tests__/corporate-workspace.test.tsx -x` | ❌ W0 | ⬜ pending |
| 6-03-04 | 03 | 1 | WORK-04 | unit | `npx vitest run src/components/workspaces/__tests__/tv-workspace.test.tsx -x` | ❌ W0 | ⬜ pending |
| 6-03-05 | 03 | 1 | WORK-05 | unit | `npx vitest run src/components/workspaces/__tests__/short-form-workspace.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/workspaces/__tests__/evaluation-card.test.tsx` — collapse/expand behavior, skeleton display, aria-labels
- [ ] `src/components/workspaces/__tests__/narrative-workspace.test.tsx` — covers WORK-01 (8 cards, correct titles, streaming skeleton)
- [ ] `src/components/workspaces/__tests__/documentary-workspace.test.tsx` — covers WORK-02
- [ ] `src/components/workspaces/__tests__/corporate-workspace.test.tsx` — covers WORK-03
- [ ] `src/components/workspaces/__tests__/tv-workspace.test.tsx` — covers WORK-04
- [ ] `src/components/workspaces/__tests__/short-form-workspace.test.tsx` — covers WORK-05
- [ ] Update existing schema tests to cover new `overallScore`/`overallSummary` fields

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cards appear progressively during streaming | ALL | Requires live streaming session | Upload a document and observe cards appearing one-by-one as stream arrives |
| Subtle status bar updates per section during streaming | ALL | Requires live streaming session | Observe status bar text changes (e.g., "Analyzing · Extracting key quotes...") then disappears on completion |
| Story Structure beat rows expand inline on click | WORK-01 | Interactive DOM behavior beyond unit testing | Click a beat row and verify description text expands inline |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
