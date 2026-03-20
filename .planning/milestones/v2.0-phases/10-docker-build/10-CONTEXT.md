# Phase 10: Docker Build - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a minimal, secure Docker image for the Next.js app running in standalone mode. Covers: multi-stage Dockerfile, .dockerignore, health check endpoint, non-root user, configurable DATABASE_PATH, and settings file path migration to the data volume. Local dev Compose and Caddy reverse proxy are separate phases (11 and 12).

</domain>

<decisions>
## Implementation Decisions

### Settings file persistence
- Settings file (`.filmintern/settings.json`) must move to `/app/data/.filmintern/settings.json` inside the container
- Shares the same `/app/data` volume as SQLite — one volume mount covers both DB and settings
- Settings dir is hardcoded to `/app/data/.filmintern` via Dockerfile `ENV SETTINGS_DIR=/app/data/.filmintern` (not a user-facing env var)
- Code change required: `src/lib/ai/settings.ts` must read `SETTINGS_DIR` env var and fall back to current behavior for non-Docker usage
- Both `DATABASE_PATH` and `SETTINGS_DIR` default to `/app/data/...` in the Dockerfile; in local dev without Docker, existing `process.cwd()` behavior is preserved

### Health check endpoint
- `/api/health` returns `{ status: "ok", version: "0.1.0", db: "connected" }`
- Version comes from `package.json` version field (read at build time or import)
- DB connectivity is verified — runs a lightweight SQLite query (e.g., `SELECT 1`)
- Returns `200` when healthy; returns `503` with `{ status: "error", db: "failed" }` if DB check fails
- Dockerfile `HEALTHCHECK` uses `CMD curl --fail http://localhost:${PORT}/api/health`

### Port configuration
- `ENV PORT=3000` set in Dockerfile as the default
- `EXPOSE 3000` in Dockerfile (documents the default)
- Next.js respects `PORT` env var natively — user can override with `-e PORT=8080` at runtime
- No other changes needed; Next.js standalone handles this automatically

### Build context / .dockerignore
- **Required exclusions** (per DOCK-03): `node_modules/`, `.next/`, `.git/`
- **Additional exclusions**: `.planning/`, `analysis_prompts/`, `*.md`, `README.md` — dev/planning files with no value in the image
- **Security exclusions**: `.env`, `.env.local`, `.env*.local` — never bake secrets into the image
- **Data exclusions**: `dev.db`, `*.db-shm`, `*.db-wal` — never bake local DB into the image
- Test files (`coverage/`, `vitest.config.ts`, `__tests__/`) are NOT excluded — acceptable in image, user didn't flag them

### Claude's Discretion
- Exact multi-stage build structure (builder + runner stages, layer ordering for cache efficiency)
- How `better-sqlite3` native addon is compiled in the builder stage (build-essential, python3-dev, etc.)
- How version is read from package.json in the health check (import vs. build-time env)
- Exact HEALTHCHECK timing parameters (interval, timeout, retries, start-period)
- Whether `.filmintern` data dir is created with `mkdir -p` in Dockerfile or entrypoint

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — DOCK-01 through DOCK-06: exact base image (node:22-bookworm-slim), standalone output, .dockerignore scope, DATABASE_PATH env var, /api/health + HEALTHCHECK directive, non-root user (uid 1001 'nextjs')

### Existing code to modify
- `src/lib/db.ts` — DATABASE_PATH hardcoded to `path.join(process.cwd(), 'dev.db')` at line 4; needs env var fallback
- `src/lib/ai/settings.ts` — SETTINGS_DIR hardcoded to `path.join(process.cwd(), '.filmintern')` at line 18; needs SETTINGS_DIR env var fallback
- `next.config.ts` — currently missing `output: 'standalone'` (DOCK-02); must be added

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db.ts`: Single-instance SQLite module — DATABASE_PATH env var change is localized to line 4 only
- `src/lib/ai/settings.ts`: SETTINGS_DIR change is localized to line 18 only — the rest of the settings logic (env var fallback for API keys) already works correctly

### Established Patterns
- `better-sqlite3` and `pdf-parse` are already declared as `serverExternalPackages` in `next.config.ts` — both are native addons that require compilation in the builder stage
- AI SDK 6 server routes use streaming (SSE) — the `output: 'standalone'` mode must not break streaming (it doesn't for App Router)
- Settings already fall back to `process.env.ANTHROPIC_API_KEY` / `process.env.OPENAI_API_KEY` — this mechanism is already in place and works in containers

### Integration Points
- `next.config.ts` is the entry point for adding `output: 'standalone'`
- `/api/health` route must be created at `src/app/api/health/route.ts` — no conflicts with existing routes
- Data volume mount target is `/app/data/` — both `dev.db` and `.filmintern/settings.json` resolve under this path

</code_context>

<specifics>
## Specific Ideas

- No specific visual or behavioral references — standard Docker/Next.js standalone patterns apply

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-docker-build*
*Context gathered: 2026-03-19*
