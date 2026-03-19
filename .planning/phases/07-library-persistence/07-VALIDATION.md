---
phase: 7
slug: library-persistence
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-19
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | LIB-02 | unit | `npx vitest run src/components/__tests__/project-type-filter.test.tsx -x` | planned | pending |
| 7-01-02 | 01 | 1 | LIB-02 | unit | `npx vitest run --reporter=verbose` | existing | pending |
| 7-02-01 | 02 | 1 | LIB-01, LIB-03, LIB-04 | unit | `npx vitest run src/app/__tests__/page.test.tsx src/components/__tests__/projects-sidebar.test.tsx -x` | planned | pending |
| 7-02-02 | 02 | 1 | LIB-01 | unit | `npx vitest run --reporter=verbose` | existing | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Auto-save fires on analysis completion | LIB-01 | E2E flow requires live AI streaming | Run analysis, check SQLite DB via `sqlite3 data/filmintern.db "SELECT id,title FROM projects ORDER BY updatedAt DESC LIMIT 5"` |
| Sidebar shows saved analyses with type filter | LIB-02 | UI interaction | Open sidebar, verify entries visible with project type icons, toggle filter checkboxes |
| Filter checkboxes hide/show entries | LIB-02 | UI interaction | Toggle project type filter, verify list updates |
| Open from sidebar loads workspace | LIB-03 | Cross-page state restore | Click entry in sidebar, verify analysis workspace loads with all cards |
| Delete removes entry | LIB-04 | Requires confirmation UI | Click delete, confirm, verify entry gone from sidebar list |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
