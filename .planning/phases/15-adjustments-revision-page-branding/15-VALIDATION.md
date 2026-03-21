---
phase: 15
slug: adjustments-revision-page-branding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest / vitest (Next.js project) |
| **Config file** | package.json |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | BRAND-01 | lint/build | `npm run build` | ✅ | ⬜ pending |
| 15-01-02 | 01 | 1 | BRAND-01 | lint/build | `npm run build` | ✅ | ⬜ pending |
| 15-02-01 | 02 | 1 | REVW-05 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 2 | REVW-06 | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/revision/[projectId]/page.tsx` — stub revision page component
- [ ] Route accessible without 404

*Existing build infrastructure covers lint/type checks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Navigate from completed workspace to revision page | REVW-05 | Requires browser navigation flow | 1. Complete an analysis. 2. Click "Adjustments / Revision" link. 3. Verify new route loads. |
| Existing analysis workflow unchanged | REVW-06 | End-to-end workflow check | Upload script → analyze → view workspace → export report. Verify no regressions. |
| Branding reads "Film Intern" everywhere | BRAND-01 | Visual scan of UI | Check page titles, nav headers, metadata in browser DevTools. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
