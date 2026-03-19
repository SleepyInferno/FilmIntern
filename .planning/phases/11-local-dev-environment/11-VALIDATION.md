---
phase: 11
slug: local-dev-environment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) + docker compose CLI |
| **Config file** | vitest.config.ts (existing) |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run && docker compose config --quiet` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run && docker compose config --quiet`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | DEV-01 | file | `test -f Dockerfile.dev` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | DEV-01 | file | `test -f docker-compose.yml` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | DEV-02 | config | `docker compose config --quiet` | ❌ W0 | ⬜ pending |
| 11-01-04 | 01 | 1 | DEV-03 | grep | `grep -q "WATCHPACK_POLLING" docker-compose.yml` | ❌ W0 | ⬜ pending |
| 11-01-05 | 01 | 1 | DEV-04 | grep | `grep -q "OLLAMA_BASE_URL" docker-compose.yml` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | DEV-05 | grep | `grep -q "OLLAMA_BASE_URL" src/lib/settings.ts` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | DEV-05 | unit | `npm run test -- --run` | ✅ | ⬜ pending |
| 11-02-03 | 02 | 1 | DEV-01 | file | `test -f .env.example` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `Dockerfile.dev` — dev-specific Dockerfile (build-essential for better-sqlite3)
- [ ] `docker-compose.yml` — compose file with volumes, env_file, extra_hosts
- [ ] `.env.example` — template for API keys and OLLAMA_BASE_URL
- [ ] `src/lib/settings.ts` updated with OLLAMA_BASE_URL env var support

*Existing vitest infrastructure covers unit tests; docker compose config validates compose syntax.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| HMR triggers on source edit | DEV-02 | Requires live browser session | Run `docker compose up`, edit a .tsx file, verify browser updates without restart |
| SQLite persists across restarts | DEV-03 | Requires container lifecycle | Create analysis, `docker compose down`, `docker compose up`, verify analysis in library |
| Ollama reaches host service | DEV-05 | Requires running Ollama on host | Start Ollama on host, run `docker compose up`, select Ollama provider, run analysis |
| .env API keys populate settings | DEV-04 | Requires UI inspection | Add ANTHROPIC_API_KEY to .env, run compose, open Settings and verify key pre-filled |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
