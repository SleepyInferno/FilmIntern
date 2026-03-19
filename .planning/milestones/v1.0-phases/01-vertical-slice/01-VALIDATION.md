---
phase: 1
slug: vertical-slice
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit/integration) + Playwright (E2E) |
| **Config file** | `vitest.config.ts` / `playwright.config.ts` — Wave 0 installs |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test && npm run test:e2e` |
| **Estimated runtime** | ~30 seconds (unit) / ~60 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | CORE-01–05 | setup | `npm run test` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | CORE-01 | unit | `npm run test -- project-type` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | CORE-02, PARSE-01 | unit+manual | `npm run test -- upload` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | CORE-03 | unit | `npm run test -- preview` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | ANLYS-01 | unit | `npm run test -- analysis` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | CORE-04, CORE-05, OUTP-01 | E2E+manual | `npm run test:e2e -- report` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — test framework configuration
- [ ] `playwright.config.ts` — E2E test configuration
- [ ] `src/__tests__/project-type.test.ts` — stubs for CORE-01
- [ ] `src/__tests__/upload.test.ts` — stubs for CORE-02, PARSE-01
- [ ] `src/__tests__/preview.test.ts` — stubs for CORE-03
- [ ] `src/__tests__/analysis.test.ts` — stubs for ANLYS-01
- [ ] `e2e/full-loop.spec.ts` — E2E stub for complete flow

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Analysis report "feels professional" | OUTP-01 | Subjective quality — not automatable | Upload a real documentary transcript, verify quotes are actual quotes from text (not hallucinated), themes reflect actual content, formatting is scannable |
| Streaming display works smoothly | CORE-04 | Visual UX — not automatable | Trigger analysis on large transcript (>5000 words), verify progressive display without UI freeze |
| Drag & drop works in browser | CORE-02 | Browser interaction — Playwright covers basic case | Manually test drag from OS file manager into drop zone |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
