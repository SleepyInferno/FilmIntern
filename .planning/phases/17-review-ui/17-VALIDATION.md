---
phase: 17
slug: review-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1.0 |
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
| 17-01-01 | 01 | 0 | REVW-01 | unit | `npx vitest run src/lib/__tests__/diff-utils.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 0 | REVW-02 | unit | `npx vitest run src/lib/__tests__/db-suggestions.test.ts -t "status" -x` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 0 | REVW-03 | unit | `npx vitest run src/lib/__tests__/script-preview.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-01-04 | 01 | 0 | REVW-04 | integration | `npx vitest run src/app/api/projects/__tests__/suggestion-regenerate.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 1 | REVW-01 | unit | `npx vitest run src/lib/__tests__/diff-utils.test.ts -x` | ✅ W0 | ⬜ pending |
| 17-02-02 | 02 | 1 | REVW-02 | unit | `npx vitest run src/lib/__tests__/db-suggestions.test.ts -x` | ✅ W0 | ⬜ pending |
| 17-03-01 | 03 | 2 | REVW-03 | unit | `npx vitest run src/lib/__tests__/script-preview.test.ts -x` | ✅ W0 | ⬜ pending |
| 17-04-01 | 04 | 3 | REVW-04 | integration | `npx vitest run src/app/api/projects/__tests__/suggestion-regenerate.test.ts -x` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/diff-utils.test.ts` — stubs for REVW-01 (word diff computation)
- [ ] `src/lib/__tests__/db-suggestions.test.ts` — stubs for REVW-02 (status update CRUD)
- [ ] `src/lib/__tests__/script-preview.test.ts` — stubs for REVW-03 (preview text derivation logic as pure function)
- [ ] `src/app/api/projects/__tests__/suggestion-regenerate.test.ts` — stubs for REVW-04 (regeneration endpoint)
- [ ] Mock for `generateObject` — needed for regeneration test (check if already exists from Phase 16)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Accept/reject buttons visually highlight with correct color (green/red) | REVW-01 | Visual styling cannot be verified by unit test | Load revision page, click accept on a suggestion, verify green highlight; click reject, verify red highlight |
| Script preview updates live as accept/reject state changes | REVW-03 | Requires DOM interaction and visual confirmation | Accept a suggestion, verify preview text reflects the rewrite; reject it, verify original text returns |
| Regeneration spinner shows and card updates in-place | REVW-04 | Async UI state requires browser observation | Click regenerate, verify spinner appears on button, verify card updates with new rewrite text in-place |
| Accept/reject state persists after page refresh | REVW-02 | Requires browser session test | Accept a suggestion, refresh page, verify accepted state is restored |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
