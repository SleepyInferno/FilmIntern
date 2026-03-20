---
phase: 13
slug: ci-cd-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — CI/CD validation is manual/workflow-based |
| **Config file** | .github/workflows/docker-publish.yml |
| **Quick run command** | `act push --dry-run` (local) or inspect workflow YAML |
| **Full suite command** | Push to main branch and verify Actions run |
| **Estimated runtime** | ~3-5 minutes (GitHub Actions build) |

---

## Sampling Rate

- **After every task commit:** Lint YAML syntax locally
- **After every plan wave:** Verify workflow file exists and is valid YAML
- **Before `/gsd:verify-work`:** Full suite must be green (successful Actions run)
- **Max feedback latency:** 300 seconds (GitHub Actions runner spin-up + build)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | CI-01 | yaml-lint | `python -m yaml .github/workflows/docker-publish.yml` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | CI-02 | file-check | `grep -r "cache-from" .github/workflows/` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | CI-03 | file-check | `grep -E "sha\|latest" .github/workflows/docker-publish.yml` | ❌ W0 | ⬜ pending |
| 13-01-04 | 01 | 1 | CI-04 | file-check | `grep "linux/amd64" .github/workflows/docker-publish.yml` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 2 | CI-05 | file-check | `test -f docs/unraid-deployment.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.github/workflows/` directory created
- [ ] Basic YAML linting available (python yaml or yamllint)

*Wave 0 is minimal — this phase creates GitHub Actions workflows, not application code.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push to main triggers workflow | CI-01 | Requires GitHub Actions runner | Push a test commit to main, verify workflow triggers in GitHub UI |
| BuildKit layer cache speeds up rebuild | CI-02 | Requires two sequential builds | Trigger two builds, compare durations in Actions UI |
| Image runs on Unraid | CI-04 | Requires Unraid hardware | Pull ghcr.io image on Unraid, run container, verify it starts |
| Image pulls successfully from GHCR | CI-03 | Requires published image | `docker pull ghcr.io/{owner}/{repo}:latest` after first successful run |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
