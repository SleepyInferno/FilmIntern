---
phase: 8
slug: provider-error-handling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/lib/ai/__tests__/provider-registry.test.ts src/app/api/analyze/__tests__/route.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/ai/__tests__/provider-registry.test.ts src/app/api/analyze/__tests__/route.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 1 | MPAI-05a/b/c/d | unit | `npx vitest run src/lib/ai/__tests__/provider-registry.test.ts -x` | ❌ new tests | ⬜ pending |
| 8-01-02 | 01 | 1 | MPAI-05e/f/g/h | unit | `npx vitest run src/app/api/analyze/__tests__/route.test.ts -x` | ❌ new tests | ⬜ pending |
| 8-01-03 | 01 | 1 | MPAI-05i | unit | `npx vitest run src/app/api/analyze/__tests__/route.test.ts -x` | ✅ exists (8 tests) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing test files cover both target modules — no new test files needed. New test cases are added to existing files:
- `src/lib/ai/__tests__/provider-registry.test.ts` — add `checkProviderHealth` tests (MPAI-05a through 05d)
- `src/app/api/analyze/__tests__/route.test.ts` — add error handling + health-check integration tests (MPAI-05e through 05h)

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ollama health-check displays error in browser UI | MPAI-05 | Requires live Ollama server stopped/started | Start app without Ollama running, upload file, trigger analysis, verify error message shown in UI |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
