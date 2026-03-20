---
phase: 10-docker-build
plan: 01
subsystem: infra
tags: [docker, standalone, health-check, env-config, better-sqlite3]

# Dependency graph
requires: []
provides:
  - Standalone Next.js output configuration with native addon tracing
  - Configurable DATABASE_PATH and SETTINGS_DIR via environment variables
  - Health check endpoint at /api/health (200/503)
  - APP_VERSION constant for build metadata
affects: [10-02, 10-03, 10-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [env-var-configurable-paths, dynamic-import-health-check, standalone-output]

key-files:
  created:
    - src/lib/version.ts
    - src/app/api/health/route.ts
    - src/lib/__tests__/db-path.test.ts
    - src/lib/ai/__tests__/settings-dir.test.ts
  modified:
    - next.config.ts
    - src/lib/db.ts
    - src/lib/ai/settings.ts

key-decisions:
  - "APP_VERSION as simple constant rather than reading package.json (fragile in standalone mode)"
  - "Dynamic import of db module in health endpoint to avoid module-level DB initialization"
  - "force-dynamic export to prevent Next.js from caching health check at build time"

patterns-established:
  - "Env var override pattern: process.env.X || path.join(process.cwd(), default)"
  - "Health endpoint pattern: dynamic import + try/catch returning 200/503"

requirements-completed: [DOCK-02, DOCK-04, DOCK-05]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 10 Plan 01: App Code Prep Summary

**Standalone output config, env-var-configurable DB/settings paths, and /api/health endpoint with DB connectivity check**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T19:07:32Z
- **Completed:** 2026-03-19T19:09:22Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- DATABASE_PATH and SETTINGS_DIR environment variables override hardcoded paths for container deployment
- next.config.ts configured with standalone output and better-sqlite3 native addon file tracing
- /api/health endpoint returns 200 (ok) or 503 (error) based on SQLite connectivity
- TDD unit tests covering env var override and fallback behavior (4 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for env var config** - `d861241` (test)
2. **Task 1 GREEN: Configurable paths implementation** - `7a90326` (feat)
3. **Task 2: Standalone output + version + health endpoint** - `8f6d1d4` (feat)

## Files Created/Modified
- `next.config.ts` - Added output: 'standalone' and outputFileTracingIncludes for better-sqlite3
- `src/lib/db.ts` - Exported DB_PATH with DATABASE_PATH env var override
- `src/lib/ai/settings.ts` - Exported SETTINGS_DIR_PATH with SETTINGS_DIR env var override
- `src/lib/version.ts` - APP_VERSION constant (0.1.0)
- `src/app/api/health/route.ts` - Health check endpoint with DB connectivity test
- `src/lib/__tests__/db-path.test.ts` - Tests for DATABASE_PATH env var behavior
- `src/lib/ai/__tests__/settings-dir.test.ts` - Tests for SETTINGS_DIR env var behavior

## Decisions Made
- Used APP_VERSION as a simple exported constant rather than reading package.json, which has fragile relative paths in standalone mode
- Used dynamic import for db module in health endpoint to avoid module-level DB initialization on import
- Used force-dynamic export constant to prevent Next.js from caching health responses at build time
- Used db.listProjects() as connectivity check since it runs a real SELECT query

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- 2 pre-existing test failures (narrative schema test, component test) confirmed unrelated to this plan's changes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All application code changes for Docker containerization are complete
- Ready for Dockerfile creation (plan 10-02) which will use standalone output and env vars
- Health endpoint ready for Docker HEALTHCHECK directive

---
*Phase: 10-docker-build*
*Completed: 2026-03-19*
