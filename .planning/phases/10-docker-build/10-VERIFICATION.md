---
phase: 10-docker-build
verified: 2026-03-19T17:38:00Z
status: passed
score: 11/11 must-haves verified
re_verification: false
deviations:
  - truth: "docker build produces a working image under 300MB"
    status: deviation_accepted
    reason: "node:22-bookworm-slim base alone is ~220MB making 300MB target unrealistic. Alpine was tested and rejected due to SWC/Turbopack SIGILL on musl libc. Image is ~440MB. All functional requirements are met. Deviation accepted by user after end-to-end verification."
---

# Phase 10: Docker Build Verification Report

**Phase Goal:** Produce a working Docker image for the Next.js application with health checking, non-root execution, and configurable data paths
**Verified:** 2026-03-19T17:38:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | next.config.ts has `output: 'standalone'` and `outputFileTracingIncludes` for better-sqlite3 | VERIFIED | next.config.ts line 4: `output: 'standalone'`; line 6-8: `outputFileTracingIncludes` with `node_modules/better-sqlite3/**/*` |
| 2  | DATABASE_PATH env var overrides the default SQLite path; without it, `process.cwd()/dev.db` is used | VERIFIED | src/lib/db.ts line 4: `export const DB_PATH = process.env.DATABASE_PATH \|\| path.join(process.cwd(), 'dev.db')` |
| 3  | SETTINGS_DIR env var overrides the default settings directory; without it, `process.cwd()/.filmintern` is used | VERIFIED | src/lib/ai/settings.ts line 18: `export const SETTINGS_DIR_PATH = process.env.SETTINGS_DIR \|\| path.join(process.cwd(), '.filmintern')` |
| 4  | /api/health returns 200 JSON with status, version, and db fields when DB is accessible | VERIFIED | src/app/api/health/route.ts returns `{ status: 'ok', version: APP_VERSION, db: 'connected' }` on success |
| 5  | /api/health returns 503 JSON with status error when DB is inaccessible | VERIFIED | src/app/api/health/route.ts returns `{ status: 'error', db: 'failed' }` with HTTP 503 in catch block |
| 6  | Build context excludes node_modules, .next, .git, .env files, and local DB files | VERIFIED | .dockerignore contains: `node_modules/`, `.next/`, `.git/`, `.env`, `.env.local`, `.env*.local`, `dev.db`, `*.db-shm`, `*.db-wal` |
| 7  | Container runs as non-root user nextjs with uid 1001 | VERIFIED | Dockerfile: `adduser --system --uid 1001 --ingroup nodejs nextjs` and `USER nextjs`; user-verified: `docker run --rm filmintern id` shows `uid=1001(nextjs)` |
| 8  | Docker HEALTHCHECK directive probes /api/health with curl | VERIFIED | Dockerfile line 74-75: `HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD curl --fail http://localhost:${PORT:-3000}/api/health \|\| exit 1` |
| 9  | Container starts and serves the app on port 3000 | VERIFIED | Human checkpoint approved: app loads at http://localhost:3000, health endpoint returns connected status |
| 10 | SQLite data directory at /app/data is owned by nextjs user | VERIFIED | Dockerfile: `mkdir -p /app/data/.filmintern && chown -R nextjs:nodejs /app/data`; `COPY --from=builder --chown=nextjs:nodejs` |
| 11 | docker build produces a working image (~440MB, deviation from 300MB target) | DEVIATION ACCEPTED | bookworm-slim base alone is ~220MB; Alpine rejected due to musl/glibc incompatibility (SIGILL); user approved after full end-to-end smoke test |

**Score:** 11/11 truths verified (1 with accepted size deviation)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `next.config.ts` | Standalone output config with native addon tracing | VERIFIED | Contains `output: 'standalone'`, `serverExternalPackages`, `outputFileTracingIncludes` |
| `src/lib/db.ts` | Configurable database path via DATABASE_PATH env var | VERIFIED | Line 4 exports `DB_PATH` using `process.env.DATABASE_PATH \|\| fallback` |
| `src/lib/ai/settings.ts` | Configurable settings dir via SETTINGS_DIR env var | VERIFIED | Line 18 exports `SETTINGS_DIR_PATH` using `process.env.SETTINGS_DIR \|\| fallback`; line 53 `mkdir(SETTINGS_DIR_PATH, ...)` |
| `src/lib/version.ts` | App version constant | VERIFIED | `export const APP_VERSION = '0.1.0'` |
| `src/app/api/health/route.ts` | Health check API endpoint | VERIFIED | Exports `GET`, `dynamic = 'force-dynamic'`, returns 200/503 |
| `src/lib/__tests__/db-path.test.ts` | Unit tests for DATABASE_PATH env var fallback | VERIFIED | 2 tests: env-set and fallback; all pass |
| `src/lib/ai/__tests__/settings-dir.test.ts` | Unit tests for SETTINGS_DIR env var fallback | VERIFIED | 2 tests: env-set and fallback; all pass |
| `.dockerignore` | Build context exclusion rules | VERIFIED | Excludes node_modules, .next, .git, .env, dev.db, .planning |
| `Dockerfile` | Multi-stage Docker build for Next.js standalone | VERIFIED | Three stages: deps/builder/runner; bookworm-slim base; non-root user; healthcheck; standalone copy pattern |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/health/route.ts` | `src/lib/db.ts` | `await import('@/lib/db')` dynamic import | WIRED | Line 8: `const { db } = await import('@/lib/db')` followed by `db.listProjects()` |
| `src/app/api/health/route.ts` | `src/lib/version.ts` | `import { APP_VERSION } from '@/lib/version'` | WIRED | Line 2: static import; line 14: `version: APP_VERSION` used in response |
| `Dockerfile` | `next.config.ts` | `npm run build` produces `.next/standalone` | WIRED | Dockerfile line 26: `RUN npm run build`; output: standalone in next.config.ts drives this |
| `Dockerfile` | `src/app/api/health/route.ts` | HEALTHCHECK curls /api/health | WIRED | Dockerfile line 75: `curl --fail http://localhost:${PORT:-3000}/api/health` |
| `Dockerfile` | `.dockerignore` | Docker reads .dockerignore to filter build context | WIRED | `.dockerignore` present at project root; contains `node_modules` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DOCK-01 | 10-02 | App builds successfully via multi-stage Dockerfile using node:22-bookworm-slim base | SATISFIED | Dockerfile uses `FROM node:22-bookworm-slim` for all three stages; build verified by user |
| DOCK-02 | 10-01 | next.config.ts configured with `output: 'standalone'` | SATISFIED | next.config.ts line 4: `output: 'standalone'` |
| DOCK-03 | 10-02 | .dockerignore excludes node_modules, .next, .git from build context | SATISFIED | .dockerignore lines 2-4: `node_modules/`, `.next/`, `.git/` |
| DOCK-04 | 10-01 | SQLite file path configurable via DATABASE_PATH env var | SATISFIED | src/lib/db.ts line 4 with env var override; unit tests pass |
| DOCK-05 | 10-01, 10-02 | App exposes /api/health returning 200 JSON; HEALTHCHECK directive in Dockerfile | SATISFIED | Health route exists and returns 200/503; Dockerfile HEALTHCHECK probes it |
| DOCK-06 | 10-02 | Container runs as non-root 'nextjs' user (uid 1001) | SATISFIED | Dockerfile creates nextjs uid 1001, `USER nextjs` before CMD; user-verified |

All 6 requirements (DOCK-01 through DOCK-06) satisfied. No orphaned requirements — all 6 are claimed by plans 10-01 and 10-02 and accounted for.

---

## Anti-Patterns Found

None. No TODO/FIXME/placeholder comments, no empty implementations, no stub return values in any phase-10 file.

---

## Human Verification Required

The following items were verified by the user as part of the Plan 02 checkpoint:

1. **Container uid check** — `docker run --rm filmintern id` confirmed `uid=1001(nextjs) gid=1001(nodejs)`
2. **Health endpoint response** — `curl -s http://localhost:3000/api/health` returned `{"status":"ok","version":"0.1.0","db":"connected"}`
3. **Docker health status** — `docker inspect --format='{{.State.Health.Status}}' fi-test` showed `healthy`
4. **App UI** — Browser at http://localhost:3000 loaded the FilmIntern UI successfully
5. **Image size acceptance** — ~440MB accepted given node:22-bookworm-slim base constraint

---

## Deviation Summary

### Image Size: 300MB Target vs ~440MB Actual

**Root cause:** The node:22-bookworm-slim base image is itself ~220MB. The 300MB plan target assumed an Alpine-based image, which was tested and rejected because SWC/Turbopack Rust binaries and better-sqlite3 native addons both cause SIGILL on Alpine's musl libc. This is a platform-level incompatibility, not a configuration issue.

**Resolution:** Reverted to bookworm-slim (the base explicitly recommended in the Phase 10 research docs). Trimmed unused better-sqlite3 architecture prebuilds to save ~15MB. Final image is ~440MB.

**Impact on goal:** None. The phase goal specifies "working Docker image with health checking, non-root execution, and configurable data paths" — all of which are fully met. The 300MB figure was a size target in the plan, not a requirement in REQUIREMENTS.md. DOCK-01 through DOCK-06 contain no size constraint.

**Status:** Accepted deviation. Documented in plan 10-02 SUMMARY.md key-decisions and deviations sections. User approved after end-to-end smoke test.

---

## Commit Verification

All commits documented in SUMMARY files were verified present in git log:

| Commit | Description | Verified |
|--------|-------------|---------|
| `d861241` | test(10-01): failing tests for env var config | PRESENT |
| `7a90326` | feat(10-01): configurable paths | PRESENT |
| `8f6d1d4` | feat(10-01): standalone output + version + health | PRESENT |
| `68aef80` | feat(10-02): .dockerignore + Dockerfile | PRESENT |
| `edfa7ef` | fix(10-02): revert to bookworm-slim, trim prebuilds | PRESENT |

---

## Summary

Phase 10 goal achieved. Every functional requirement is satisfied:

- The Dockerfile builds a working production image using a three-stage multi-stage build with node:22-bookworm-slim
- The Next.js app is configured for standalone output with better-sqlite3 native addon tracing
- DATABASE_PATH and SETTINGS_DIR are runtime-configurable via environment variables, defaulting to safe fallbacks
- The /api/health endpoint returns 200 (connected) or 503 (error) based on live SQLite connectivity
- The HEALTHCHECK directive in the Dockerfile probes /api/health and reports container health to Docker
- The container runs as non-root user nextjs (uid 1001) with /app/data owned by that user
- The build context is clean: node_modules, .next, .git, .env files, and local DB files are all excluded
- All unit tests pass (4 tests covering env var override and fallback for both DATABASE_PATH and SETTINGS_DIR)

The only deviation from plan targets is image size (~440MB vs 300MB target). This is an accepted consequence of the bookworm-slim base requirement and does not affect any requirement in REQUIREMENTS.md.

---

_Verified: 2026-03-19T17:38:00Z_
_Verifier: Claude (gsd-verifier)_
