---
phase: 4
slug: export-and-document-generation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 4 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-W0-01 | W0 | 0 | OUTP-03 | integration | `npx vitest run src/app/api/documents/generate/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 4-W0-02 | W0 | 0 | OUTP-02 | integration | `npx vitest run src/app/api/export/__tests__/pdf.route.test.ts` | ❌ W0 | ⬜ pending |
| 4-W0-03 | W0 | 0 | OUTP-02 | integration | `npx vitest run src/app/api/export/__tests__/docx.route.test.ts` | ❌ W0 | ⬜ pending |
| 4-W0-04 | W0 | 0 | OUTP-03 | component | `npx vitest run src/components/__tests__/document-workspace.test.tsx` | ❌ W0 | ⬜ pending |
| 4-W0-05 | W0 | 0 | OUTP-03 | unit | `npx vitest run src/lib/documents/__tests__/availability.test.ts` | ❌ W0 | ⬜ pending |
| 4-W0-06 | W0 | 0 | OUTP-02, OUTP-03 | unit | `npx vitest run src/lib/documents/__tests__/docx-export.test.ts` | ❌ W0 | ⬜ pending |
| 4-W0-07 | W0 | 0 | OUTP-02 | unit | `npx vitest run src/lib/documents/__tests__/pdf-template.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/documents/generate/__tests__/route.test.ts` - covers OUTP-03 generation rules and request validation
- [ ] `src/app/api/export/__tests__/pdf.route.test.ts` - covers OUTP-02 PDF byte response and headers
- [ ] `src/app/api/export/__tests__/docx.route.test.ts` - covers OUTP-02 DOCX byte response and headers
- [ ] `src/components/__tests__/document-workspace.test.tsx` - covers tabs, editor interactions, and export action visibility
- [ ] `src/lib/documents/__tests__/availability.test.ts` - covers project-type document matrix
- [ ] `src/lib/documents/__tests__/docx-export.test.ts` - covers cover page, headings, and quote-label preservation
- [ ] `src/lib/documents/__tests__/pdf-template.test.ts` - covers export HTML/template selection and layout profile selection

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Narrative and TV exports read as screenplay-style where applicable | OUTP-02, OUTP-03 | Formatting quality and screenplay feel are subjective | Generate a narrative or TV document, export PDF and DOCX, and confirm cover page, headings, and screenplay-style spacing/structure match the chosen preset |
| Documentary and corporate proposal exports feel like polished studio/client deliverables | OUTP-02, OUTP-03 | Professional presentation quality is subjective | Generate documentary and corporate outputs, export both formats, and confirm cover page metadata, hierarchy, and typography feel professional rather than like app UI |
| Quote references remain understandable after editing and export | OUTP-03 | Requires interactive and visual verification across views | Edit a generated document, click quote references in-app to verify jump behavior, then export PDF and DOCX and confirm readable non-interactive quote labels remain present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
