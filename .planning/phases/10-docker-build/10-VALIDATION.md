---
phase: 10
slug: docker-build
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose` + Docker smoke tests (see below)
- **Before `/gsd:verify-work`:** Full vitest suite must be green + Docker build + health check verified
- **Max feedback latency:** ~15 seconds (unit tests); Docker smoke tests run per-wave only

**Docker smoke test sequence (per-wave):**
```bash
docker build -t filmintern . && \
  docker run --rm filmintern id && \
  docker run -d --name fi-test -p 3000:3000 filmintern && \
  sleep 5 && \
  curl http://localhost:3000/api/health && \
  docker stop fi-test && docker rm fi-test
```

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-W0-01 | W0 | 0 | DOCK-04 | unit | `npx vitest run src/lib/__tests__/db-path.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-W0-02 | W0 | 0 | DOCK-04 | unit | `npx vitest run src/lib/ai/__tests__/settings-dir.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01 | 01 | 1 | DOCK-03 | smoke (manual) | `docker build . 2>&1 \| grep "Sending build context"` | N/A | ⬜ pending |
| 10-02 | 01 | 1 | DOCK-02 | smoke (manual) | `npm run build && ls .next/standalone/server.js` | N/A | ⬜ pending |
| 10-03 | 01 | 1 | DOCK-04 | unit | `npx vitest run src/lib/__tests__/db-path.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-04 | 01 | 1 | DOCK-04 | unit | `npx vitest run src/lib/ai/__tests__/settings-dir.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-05 | 01 | 1 | DOCK-01 | smoke (manual) | `docker build -t filmintern .` | N/A | ⬜ pending |
| 10-06 | 01 | 1 | DOCK-06 | smoke (manual) | `docker run --rm filmintern id` | N/A | ⬜ pending |
| 10-07 | 01 | 1 | DOCK-05 | integration | `curl http://localhost:3000/api/health` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/db-path.test.ts` — unit test verifying `DATABASE_PATH` env var fallback (covers DOCK-04)
- [ ] `src/lib/ai/__tests__/settings-dir.test.ts` — unit test verifying `SETTINGS_DIR` env var fallback

*No framework install needed — vitest already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker image builds under 300MB | DOCK-01 | Requires running Docker daemon | `docker build -t filmintern . && docker image inspect filmintern --format='{{.Size}}'` — must be < 314572800 bytes |
| Build context excludes node_modules, .next, .git | DOCK-03 | Requires Docker build output | `docker build .` — "Sending build context" line must show < 50MB |
| Container starts, serves on port 3000 | DOCK-01 | Requires Docker runtime | `docker run -d -p 3000:3000 filmintern && curl http://localhost:3000` |
| Container runs as uid 1001 | DOCK-06 | Requires Docker runtime | `docker run --rm filmintern id` — must show `uid=1001(nextjs)` |
| /api/health returns 200 JSON | DOCK-05 | Requires running container | `curl -s http://localhost:3000/api/health` — must return `{"status":"ok","version":"...","db":"connected"}` |
| Docker HEALTHCHECK reports healthy | DOCK-05 | Requires Docker daemon health state | `docker inspect --format='{{.State.Health.Status}}' <container>` — must be `healthy` after start-period |
| SQLite writes to DATABASE_PATH | DOCK-04 | Requires Docker runtime with volume | `docker run -v /tmp/test-data:/app/data filmintern` — db file at `/tmp/test-data/filmintern.db` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
