---
phase: 10-docker-build
plan: 02
subsystem: infra
tags: [docker, dockerfile, multi-stage-build, bookworm-slim, non-root, healthcheck]

# Dependency graph
requires:
  - phase: 10-01
    provides: Standalone output config, configurable env vars, health endpoint
provides:
  - Multi-stage Dockerfile producing production-ready image
  - .dockerignore excluding build artifacts and secrets from context
  - Non-root container execution (nextjs uid 1001)
  - Docker HEALTHCHECK directive probing /api/health
  - Configurable data directory at /app/data owned by nextjs user
affects: [11-01, 12-01, 13-01]

# Tech tracking
tech-stack:
  added: [docker, bookworm-slim]
  patterns: [multi-stage-build, non-root-container, standalone-copy-pattern]

key-files:
  created:
    - .dockerignore
    - Dockerfile
  modified: []

key-decisions:
  - "bookworm-slim over Alpine: better-sqlite3 and SWC/Turbopack require glibc (Alpine musl causes SIGILL)"
  - "Three-stage build (deps/builder/runner) to separate native addon compilation from runtime"
  - "Image size ~440MB accepted: 300MB target unrealistic given 220MB node:22-bookworm-slim base"
  - "better-sqlite3 prebuild trimming: remove unused arch prebuilds to save ~15MB"

patterns-established:
  - "Multi-stage pattern: deps (build-essential + npm ci) -> builder (npm run build) -> runner (standalone copy)"
  - "Non-root pattern: addgroup nodejs (1001) + adduser nextjs (1001), USER nextjs before CMD"
  - "Standalone copy pattern: .next/standalone + .next/static + public (three explicit COPYs)"

requirements-completed: [DOCK-01, DOCK-03, DOCK-05, DOCK-06]

# Metrics
duration: 12min
completed: 2026-03-19
---

# Phase 10 Plan 02: Docker Infrastructure Summary

**Multi-stage Dockerfile with bookworm-slim base producing ~440MB production image with non-root user, health check, and native addon support**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-19T19:12:00Z
- **Completed:** 2026-03-19T19:24:00Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments
- .dockerignore excludes node_modules, .next, .git, .env files, and local DB files from build context
- Multi-stage Dockerfile builds Next.js standalone output with native addon support (better-sqlite3)
- Container runs as non-root user nextjs (uid 1001) with data directory ownership
- HEALTHCHECK probes /api/health with curl, reporting container as healthy
- Image verified end-to-end: builds, starts, serves app on port 3000, health endpoint returns connected status

## Task Commits

Each task was committed atomically:

1. **Task 1: Create .dockerignore and multi-stage Dockerfile** - `68aef80` (feat)
   - Additional fix commits during Alpine investigation:
   - `5b06e39` fix: switch to Alpine (attempt)
   - `5b65df0` fix: disable Turbopack in Docker build
   - `29a8874` fix: disable Turbopack via env var
   - `276c973` fix: add libc6-compat for Alpine
   - `edfa7ef` fix: revert to bookworm-slim, trim prebuilds (final working state)

2. **Task 2: Verify Docker image works end-to-end** - checkpoint:human-verify (approved)

## Files Created/Modified
- `.dockerignore` - Excludes node_modules, .next, .git, .env, .planning, local DB files from build context
- `Dockerfile` - Three-stage multi-stage build: deps (native addons), builder (Next.js build), runner (standalone runtime)

## Decisions Made
- **bookworm-slim over Alpine:** Alpine (musl libc) is fundamentally incompatible with SWC/Turbopack Rust binaries and better-sqlite3 native addons -- both cause SIGILL. Research correctly identified bookworm-slim as the right choice.
- **440MB image size accepted:** The 300MB target from the plan was unrealistic given the node:22-bookworm-slim base image alone is ~220MB. All functional requirements are met at ~440MB.
- **better-sqlite3 prebuild trimming:** Removing unused architecture prebuilds saves ~15MB without affecting functionality.
- **Three-stage build:** Separating dependency installation (with build-essential) from the build stage and runtime stage minimizes the final image size.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Alpine musl incompatibility with native binaries**
- **Found during:** Task 1 (Dockerfile creation and build verification)
- **Issue:** Attempted Alpine base to meet 300MB size target, but SWC/Turbopack Rust binary causes SIGILL on musl libc, and better-sqlite3 also requires glibc
- **Fix:** Reverted to bookworm-slim (as originally specified in research docs), trimmed unused better-sqlite3 prebuilds
- **Files modified:** Dockerfile
- **Verification:** docker build succeeds, container starts, health check passes
- **Committed in:** edfa7ef (final revert commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Alpine detour resolved by reverting to researched recommendation. Image size target revised from 300MB to ~440MB (realistic given base image). All functional requirements met.

## Issues Encountered
- Alpine (node:22-alpine) causes SIGILL in SWC/Turbopack and better-sqlite3 due to musl vs glibc incompatibility -- this is a fundamental platform limitation, not a configuration issue
- Multiple fix attempts (5 commits) before reverting to the originally-researched bookworm-slim base

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Docker image builds and runs successfully -- ready for Phase 11 (Docker Compose for local dev)
- Phase 12 (Caddy reverse proxy) and Phase 13 (CI/CD) can also proceed, as they depend only on the Dockerfile
- Note for Phase 11: volume mount for /app/data needs uid 1001 ownership on host (document in compose setup)
- Note for Phase 13: image size (~440MB) is acceptable for GHCR; no further optimization needed

## Self-Check: PASSED

All files verified present, all commit hashes found in git log.

---
*Phase: 10-docker-build*
*Completed: 2026-03-19*
