---
phase: 12
slug: production-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | docker compose / curl (integration testing) |
| **Config file** | docker-compose.prod.yml (to be created) |
| **Quick run command** | `docker compose -f docker-compose.prod.yml ps` |
| **Full suite command** | `docker compose -f docker-compose.prod.yml up -d && curl -f http://localhost:7430/api/health` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `docker compose -f docker-compose.prod.yml config` (validates compose syntax)
- **After every plan wave:** Run full stack startup and health check
- **Before `/gsd:verify-work`:** Full suite must be green (Caddy + app both healthy)
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | PROD-01 | integration | `docker compose -f docker-compose.prod.yml config` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | PROD-02 | integration | `curl -N http://localhost:7430/api/analyze` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `docker-compose.prod.yml` — production compose file with Caddy + app services
- [ ] `Caddyfile` — reverse proxy config with `flush_interval -1`
- [ ] Docker environment running with GHCR auth configured

*Note: This phase primarily creates infrastructure files rather than code — automated testing is integration-based (docker compose up + curl).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| HTTPS auto-provisioning | PROD-01 | Requires live domain + DNS pointing to host | Configure domain in Caddyfile, run `docker compose up`, verify certificate issued |
| SSE streaming without buffering | PROD-02 | Requires observing real-time streaming behavior | Run AI analysis via `curl -N https://domain/api/analyze`, verify chunks arrive progressively |
| Ollama connectivity from container | PROD-02 | Requires Ollama running on host | Confirm `host-gateway` extra_host resolves and Ollama responds |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
