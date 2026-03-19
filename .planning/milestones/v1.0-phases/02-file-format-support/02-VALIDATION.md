---
phase: 2
slug: file-format-support
status: draft
nyquist_compliant: false
wave_0_complete: planned
created: 2026-03-16
---

# Phase 2 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose src/lib/parsers/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose src/lib/parsers/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-02-01 | 02 | 0 | PARSE-02/03/04 | unit stubs | `npx vitest run src/lib/parsers/__tests__/screenplay-utils.test.ts src/lib/parsers/__tests__/pdf-parser.test.ts src/lib/parsers/__tests__/fdx-parser.test.ts src/lib/parsers/__tests__/docx-parser.test.ts --reporter=verbose` | planned | pending |
| 2-01-01 | 01 | 1 | PARSE-02/03/04 | unit | `npx vitest run src/lib/parsers/__tests__/txt-parser.test.ts src/app/api/upload/__tests__/route.test.ts --reporter=verbose` | yes | pending |
| 2-01-02 | 01 | 1 | PARSE-02/03/04 | unit | `npx vitest run src/lib/types/__tests__/project-types.test.ts --reporter=verbose` | yes | pending |
| 2-02-02 | 02 | 2 | PARSE-02/03/04 | unit | `npx vitest run src/lib/parsers/__tests__/screenplay-utils.test.ts src/lib/parsers/__tests__/pdf-parser.test.ts src/lib/parsers/__tests__/fdx-parser.test.ts src/lib/parsers/__tests__/docx-parser.test.ts --reporter=verbose` | yes | pending |
| 2-02-03 | 02 | 2 | PARSE-02 | unit | `npx vitest run src/lib/parsers/__tests__/screenplay-utils.test.ts src/lib/parsers/__tests__/pdf-parser.test.ts --reporter=verbose` | yes | pending |
| 2-02-04 | 02 | 2 | PARSE-03/04 | unit | `npx vitest run --reporter=verbose` | yes | pending |
| 2-02-05 | 02 | 2 | PARSE-02/03/04 | typecheck | `npx tsc --noEmit` | yes | pending |
| 2-02-06 | 02 | 2 | PARSE-02/03/04 | e2e-manual | Manual upload test | n/a | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [x] Plan includes `src/lib/parsers/__tests__/pdf-parser.test.ts` stubs for PARSE-02
- [x] Plan includes `src/lib/parsers/__tests__/fdx-parser.test.ts` stubs for PARSE-03
- [x] Plan includes `src/lib/parsers/__tests__/docx-parser.test.ts` stubs for PARSE-04
- [x] Plan includes `src/lib/parsers/__tests__/screenplay-utils.test.ts` stubs for PDF screenplay structure detection

Wave 0 is satisfied by `02-02` Task 1 before any implementation task depends on parser-specific tests.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF screenplay scene headings display correctly in preview | PARSE-02 | Requires real screenplay PDF; heuristic accuracy is subjective | Upload a real Final Draft-exported PDF; verify INT./EXT. headings, character names, and dialogue appear in parsed preview |
| FDX file upload and parse via browser | PARSE-03 | Requires browser file picker interaction | Upload a .fdx file; verify scenes, characters, and dialogue display in content preview |
| DOCX upload renders paragraph structure readably | PARSE-04 | Requires browser render confirmation | Upload a .docx file; verify paragraph blocks render in preview and raw text is still available when structure is absent |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter after execution evidence is collected

**Approval:** ready for execution
