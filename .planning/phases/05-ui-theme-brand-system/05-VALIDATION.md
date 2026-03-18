---
phase: 5
slug: ui-theme-brand-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 + @testing-library/react 16.3.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-W0-01 | 01 | 0 | THEME-01, THEME-03 | unit | `npx vitest run src/components/__tests__/theme-toggle.test.tsx -x` | ❌ W0 | ⬜ pending |
| 5-W0-02 | 01 | 0 | THEME-02, THEME-03 | unit | `npx vitest run src/lib/__tests__/theme.test.ts -x` | ❌ W0 | ⬜ pending |
| 5-01-01 | 01 | 1 | THEME-01 | unit | `npx vitest run src/components/__tests__/theme-toggle.test.tsx -x` | ✅ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | THEME-02 | unit | `npx vitest run src/lib/__tests__/theme.test.ts -x` | ✅ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | THEME-03 | unit | `npx vitest run src/lib/__tests__/theme.test.ts -x` | ✅ W0 | ⬜ pending |
| 5-02-01 | 02 | 1 | THEME-02 | unit | `npx vitest run --reporter=verbose` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/theme-toggle.test.tsx` — stubs for THEME-01, THEME-03 (toggle behavior, localStorage persistence)
- [ ] `src/lib/__tests__/theme.test.ts` — stubs for THEME-02, THEME-03 (accent preset definitions, applyAccentColor function, localStorage persistence)
- [ ] `npm install next-themes` — required dependency for theme switching

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No flash-of-wrong-theme on page load | THEME-03 | Requires browser rendering — cannot detect FOUC in vitest | 1. Select "blue" accent in settings. 2. Hard-refresh page. 3. Verify no amber flash before blue accent loads. |
| Theme toggle shows correct icon (sun/moon) | THEME-01 | Icon rendering is visual | 1. Set dark mode — verify Moon icon shows. 2. Toggle to light — verify Sun icon shows. |
| All pages respect active theme | THEME-01 | Cross-page visual check | Visit home, settings, dashboard, exports, shot-lists, image-prompts in both light and dark — verify no stone-* or amber-* hardcoded colors remain visible. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
