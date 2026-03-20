# Phase 11: Local Dev Environment - Research

**Researched:** 2026-03-19
**Domain:** Docker Compose development workflow, Next.js HMR in containers, SQLite persistence, Ollama host connectivity
**Confidence:** HIGH

## Summary

Phase 11 creates a Docker Compose development environment where a developer can clone the repo, run `docker compose up`, and have a fully working Next.js app with hot module reload, persistent SQLite storage, API key configuration via `.env`, and connectivity to Ollama running on the host machine.

The production Dockerfile from Phase 10 uses a multi-stage build producing a standalone output -- this is NOT suitable for development. Dev needs `npm run dev` with source bind-mounts. The recommended approach is a separate `docker-compose.yml` (dev-only) that uses the `node:22-bookworm-slim` base image directly (no multi-stage build) and runs `npm install && npm run dev`. This avoids complexity of maintaining a dev stage in the production Dockerfile.

**Primary recommendation:** Create a single `docker-compose.yml` for dev use (not `docker-compose.override.yml`) that bind-mounts the source, uses an anonymous volume for `node_modules`, sets `WATCHPACK_POLLING=true` for reliable HMR on Windows/WSL2, mounts `./data:/app/data` for SQLite persistence, and uses `extra_hosts` for Ollama host connectivity. Provide a `.env.example` template for API keys.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEV-01 | Developer can start the app with `docker compose up` (no Node.js install required) | docker-compose.yml with node:22-bookworm-slim image, `npm ci && npm run dev` entrypoint, port 3000 exposed |
| DEV-02 | Dev Compose uses bind-mounted source for hot module reload | Bind mount `./:/app` with anonymous volume `/app/node_modules` to isolate container deps; `WATCHPACK_POLLING=true` for Windows/WSL2 compatibility |
| DEV-03 | SQLite database persists across container restarts via volume mount (./data:/app/data) | Named bind mount `./data:/app/data`, DATABASE_PATH=/app/data/filmintern.db and SETTINGS_DIR=/app/data/.filmintern already configurable via env vars from Phase 10 |
| DEV-04 | AI provider API keys set via .env file populate the settings UI as defaults | `env_file: .env` in compose + `.env.example` template; settings.ts already reads `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` from process.env |
| DEV-05 | Ollama running on the host is reachable from inside the container | `extra_hosts: ["host.docker.internal:host-gateway"]` + override default Ollama baseURL to use `host.docker.internal` via `OLLAMA_BASE_URL` env var |
</phase_requirements>

## Architecture Patterns

### Dev vs Production: Separate Concerns

The production Dockerfile (Phase 10) produces a standalone, minimal image. The dev compose file is a completely separate concern:

| Aspect | Production (Phase 10) | Development (Phase 11) |
|--------|----------------------|------------------------|
| Dockerfile | Multi-stage, standalone output | None needed -- use base image directly |
| Command | `node server.js` | `npm run dev` |
| Source | Baked into image at build | Bind-mounted from host |
| node_modules | In standalone output | Installed in container, anonymous volume |
| .next | Pre-built static | Generated on-the-fly by dev server |
| Hot reload | N/A | Yes, via WATCHPACK_POLLING |

**Key insight:** Do NOT add a "dev" stage to the production Dockerfile. Use `docker-compose.yml` with inline image + command configuration. This keeps the production Dockerfile clean and avoids confusing developers about which target to use.

### Recommended docker-compose.yml Structure

```yaml
services:
  app:
    image: node:22-bookworm-slim
    working_dir: /app
    command: sh -c "npm install && npm run dev"
    ports:
      - "3000:3000"
    volumes:
      - .:/app                    # Source bind mount
      - /app/node_modules         # Anonymous volume (isolate from host)
      - /app/.next                # Anonymous volume (build cache)
      - ./data:/app/data          # SQLite persistence
    environment:
      - WATCHPACK_POLLING=true    # Required for Windows/WSL2 HMR
      - DATABASE_PATH=/app/data/filmintern.db
      - SETTINGS_DIR=/app/data/.filmintern
    env_file:
      - path: .env
        required: false           # Don't fail if .env doesn't exist
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### Volume Strategy

```
Host                    Container
./                  --> /app/            (bind mount: source code)
                        /app/node_modules (anonymous volume: container-only)
                        /app/.next        (anonymous volume: build cache)
./data/             --> /app/data/       (bind mount: SQLite persistence)
.env                --> env_file         (env vars loaded by compose)
```

**Why anonymous volume for node_modules:**
- Host may not have node_modules (no Node.js installed -- that's the whole point)
- Even if host has node_modules, native addons (better-sqlite3) are platform-specific
- Anonymous volume overlays the bind mount, keeping container's node_modules isolated
- `docker compose up -V` recreates anonymous volumes if deps change

**Why anonymous volume for .next:**
- Build cache is platform-specific (SWC binaries)
- Prevents host .next from leaking into container
- Dev server regenerates as needed

### Ollama Host Connectivity (DEV-05)

**The Problem:** Inside the container, `localhost` refers to the container itself, not the host. Ollama runs on the host at `localhost:11434`. The app's default Ollama baseURL is `http://localhost:11434/api` -- this will fail from inside the container.

**Solution -- Two parts:**

1. **Network:** Add `extra_hosts: ["host.docker.internal:host-gateway"]` to docker-compose.yml. This works on all platforms:
   - Docker Desktop (Mac/Windows): `host.docker.internal` already resolves natively, but the directive is harmless
   - Linux Docker Engine: `host-gateway` maps to the host's IP (typically 172.17.0.1)

2. **Default URL override:** The app needs to know to use `host.docker.internal` instead of `localhost` for Ollama. Two approaches:
   - **Option A (code change):** Add `OLLAMA_BASE_URL` env var support to `settings.ts` DEFAULT_SETTINGS, similar to how `ANTHROPIC_API_KEY` overrides the API key. Set `OLLAMA_BASE_URL=http://host.docker.internal:11434/api` in docker-compose.yml environment.
   - **Option B (no code change):** Document that users must change the Ollama URL in the Settings UI to `http://host.docker.internal:11434/api`.

   **Recommendation: Option A** -- env var override. It provides zero-friction experience (just works) and follows the existing pattern established by `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` env var overrides in settings.ts.

### .env File Strategy (DEV-04)

**How it works today:** `settings.ts` already reads `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` from `process.env` as fallbacks when no settings.json exists or when the API key field is empty. Docker Compose's `env_file` directive loads `.env` into the container's environment.

**What to create:**
- `.env.example` -- template file checked into git with placeholder values
- `.env` -- actual file with real keys, NOT checked into git (already in `.dockerignore` and should be in `.gitignore`)

```
# .env.example
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
# OLLAMA_BASE_URL=http://host.docker.internal:11434/api  # auto-set by docker-compose
```

**Docker Compose env_file with `required: false`:** Using `required: false` (Compose v2.24+) means `docker compose up` works even without a `.env` file. Users who don't need API keys (e.g., Ollama-only users) can skip creating `.env`.

### Entrypoint Strategy

The `command: sh -c "npm install && npm run dev"` pattern:
- Runs `npm install` on every start -- this is intentional for dev. It ensures node_modules in the anonymous volume stay in sync with package.json changes.
- `npm install` (not `npm ci`) is correct here because the anonymous volume may have partial state, and `npm install` is idempotent and fast when node_modules already exists.
- Alternative: use a custom entrypoint script for more complex logic (e.g., run migrations), but for this project a one-liner suffices.

**build-essential requirement:** better-sqlite3 requires native compilation. The `node:22-bookworm-slim` image does NOT include build-essential. The command must install it first:

```yaml
command: >
  sh -c "apt-get update && apt-get install -y --no-install-recommends build-essential python3 &&
         npm install &&
         npm run dev"
```

This is slow on first run (~30-60s for apt-get). A better approach is to use a lightweight Dockerfile for dev:

```dockerfile
# Dockerfile.dev
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
CMD ["sh", "-c", "npm install && npm run dev"]
```

Then in docker-compose.yml:
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
```

**Recommendation: Use Dockerfile.dev.** It avoids reinstalling build-essential on every container start and keeps the compose file clean.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dev server in Docker | Custom entrypoint with webpack watch config | `npm run dev` with WATCHPACK_POLLING | Next.js dev server handles HMR natively |
| node_modules isolation | Complex rsync or copy scripts | Anonymous volume `/app/node_modules` | Docker's volume overlay is the standard pattern |
| Host DNS resolution | Manual IP detection scripts | `extra_hosts: host.docker.internal:host-gateway` | Docker's built-in mechanism, works cross-platform |
| Env var loading | Custom .env parser | `env_file` directive in docker-compose.yml | Compose handles this natively |

## Common Pitfalls

### Pitfall 1: node_modules platform mismatch
**What goes wrong:** Host has Windows/Mac node_modules with platform-specific native addons (better-sqlite3). Container bind mount includes host's node_modules, causing runtime crashes.
**Why it happens:** Bind mount `./:/app` includes host's `node_modules/` directory.
**How to avoid:** Anonymous volume for `/app/node_modules` -- it overlays the bind mount so the container uses its own platform-appropriate modules.
**Warning signs:** `Error: Could not locate the bindings file` or `SIGILL` errors on startup.

### Pitfall 2: HMR not working on Windows/WSL2
**What goes wrong:** File changes on the host don't trigger recompilation in the container.
**Why it happens:** Docker Desktop on Windows uses WSL2, which has unreliable inotify event propagation for bind-mounted files from the Windows filesystem.
**How to avoid:** Set `WATCHPACK_POLLING=true` environment variable. This enables polling-based file watching.
**Warning signs:** Editing a file and seeing no recompilation in the container logs.

### Pitfall 3: Stale anonymous volumes after dependency changes
**What goes wrong:** `npm install` runs but uses cached node_modules from a previous container run, missing new dependencies.
**Why it happens:** Anonymous volumes persist across `docker compose down` / `docker compose up` cycles.
**How to avoid:** Run `docker compose up -V` (or `--renew-anon-volumes`) after changing package.json. Document this in the README or .env.example.
**Warning signs:** `MODULE_NOT_FOUND` errors after adding a new dependency.

### Pitfall 4: SQLite data directory doesn't exist on host
**What goes wrong:** Container fails to write the database because `./data/` directory doesn't exist on the host.
**Why it happens:** Git doesn't track empty directories, and the `./data` directory is not part of the repo.
**How to avoid:** Use `mkdir -p` in the entrypoint, or add a `.gitkeep` file in `data/`, or create it in the compose command. The app code already calls `mkdir` for SETTINGS_DIR but not for the database directory parent.
**Warning signs:** `SQLITE_CANTOPEN` error on first run.

### Pitfall 5: better-sqlite3 compilation without build-essential
**What goes wrong:** `npm install` fails because better-sqlite3 needs C++ compilation tools.
**Why it happens:** `node:22-bookworm-slim` does not include build-essential or python3.
**How to avoid:** Use a Dockerfile.dev that pre-installs build-essential and python3.
**Warning signs:** `gyp ERR! build error` during npm install.

### Pitfall 6: Ollama localhost unreachable from container
**What goes wrong:** Selecting Ollama as AI provider fails with "Cannot reach Ollama" error.
**Why it happens:** Default Ollama URL is `http://localhost:11434/api`, but `localhost` inside the container is the container itself.
**How to avoid:** Set `OLLAMA_BASE_URL=http://host.docker.internal:11434/api` via environment variable + add `extra_hosts` mapping.
**Warning signs:** Ollama health check fails even though Ollama is running on the host.

## Code Examples

### docker-compose.yml (complete)

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
      - ./data:/app/data
    environment:
      - WATCHPACK_POLLING=true
      - DATABASE_PATH=/app/data/filmintern.db
      - SETTINGS_DIR=/app/data/.filmintern
      - OLLAMA_BASE_URL=http://host.docker.internal:11434/api
    env_file:
      - path: .env
        required: false
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### Dockerfile.dev

```dockerfile
FROM node:22-bookworm-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential python3 && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
CMD ["sh", "-c", "npm install && npm run dev"]
```

### .env.example

```bash
# FilmIntern Local Development
# Copy this file to .env and fill in your API keys

# AI Provider API Keys (optional - set the ones you use)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Ollama is auto-configured to reach host.docker.internal
# Override only if running Ollama on a different host/port:
# OLLAMA_BASE_URL=http://host.docker.internal:11434/api
```

### Ollama env var override in settings.ts

```typescript
// In DEFAULT_SETTINGS or loadSettings():
ollama: {
  model: 'llama3.1',
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api'
},
```

This follows the same pattern as ANTHROPIC_API_KEY / OPENAI_API_KEY: env var provides the default, user can override in Settings UI, saved settings take precedence.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CHOKIDAR_USEPOLLING | WATCHPACK_POLLING | Next.js 12+ (2022) | Use WATCHPACK_POLLING, not CHOKIDAR |
| docker-compose.override.yml | Single docker-compose.yml for dev | Convention | Simpler for dev-only projects |
| `--add-host` CLI flag | `extra_hosts` + `host-gateway` in compose | Docker Engine 20.10+ | Declarative, cross-platform |
| `env_file: .env` (required) | `env_file: - path: .env; required: false` | Compose v2.24+ (2024) | Graceful when .env missing |

## .gitignore Updates Needed

The existing `.env` is in `.dockerignore` but verify it's also in `.gitignore`:
- `data/` directory (SQLite database files)
- `.env` (already likely ignored)
- Confirm `.env.example` is NOT ignored

## Open Questions

1. **Turbopack vs Webpack for dev server in Docker**
   - What we know: `npm run dev` in Next.js 16 may use Turbopack by default. Phase 10 had to disable Turbopack (`TURBOPACK=0`) during production builds because of incompatibility.
   - What's unclear: Whether Turbopack's file watching works correctly with Docker bind mounts and WATCHPACK_POLLING.
   - Recommendation: Set `TURBOPACK=0` in the dev compose environment to use Webpack, which has proven Docker compatibility. Can be removed later if Turbopack Docker support improves.

2. **First-run data directory creation**
   - What we know: `./data` directory needs to exist on host for the bind mount. The app creates `SETTINGS_DIR` via `mkdir -p` but database path parent directory creation may not be handled.
   - Recommendation: Add `mkdir -p /app/data` to the entrypoint command, or ensure db.ts creates the parent directory before opening the database.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEV-01 | `docker compose up` starts app on localhost:3000 | smoke (manual) | `docker compose up -d && curl -sf http://localhost:3000/api/health` | No -- Wave 0 |
| DEV-02 | File edit triggers HMR in browser | manual-only | N/A (requires browser observation) | N/A |
| DEV-03 | SQLite persists across restart | smoke (manual) | `docker compose down && docker compose up -d && curl -sf http://localhost:3000/api/health` | No -- Wave 0 |
| DEV-04 | .env API keys populate settings | integration (manual) | N/A (requires Settings UI inspection) | N/A |
| DEV-05 | Ollama on host reachable from container | integration (manual) | `docker compose exec app curl -sf http://host.docker.internal:11434/api/tags` | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (ensure no regressions from code changes)
- **Per wave merge:** Full vitest suite + manual docker compose smoke test
- **Phase gate:** All 5 success criteria verified manually via docker compose

### Wave 0 Gaps
- [ ] No automated tests needed -- this phase is infrastructure (docker-compose.yml, Dockerfile.dev, .env.example)
- [ ] Only code change is OLLAMA_BASE_URL env var in settings.ts -- covered by existing settings test patterns
- [ ] Manual verification checklist in PLAN.md serves as the test plan

## Sources

### Primary (HIGH confidence)
- Project source code: `src/lib/ai/settings.ts`, `src/lib/db.ts`, `Dockerfile`, `package.json` -- verified current env var patterns
- Phase 10 summaries: `10-01-SUMMARY.md`, `10-02-SUMMARY.md` -- verified Docker infrastructure decisions

### Secondary (MEDIUM confidence)
- [Enabling Hot Reloading for Next.js in Docker](https://dev.to/yuvraajsj18/enabling-hot-reloading-for-nextjs-in-docker-4k39) - WATCHPACK_POLLING pattern
- [Best Next.js docker-compose hot-reload setup](https://medium.com/@elifront/best-next-js-docker-compose-hot-reload-production-ready-docker-setup-28a9125ba1dc) - Volume strategy (anonymous volume for node_modules)
- [Fixing host.docker.internal on Linux](https://abhihyder.medium.com/fixing-host-docker-internal-issue-in-docker-compose-on-linux-f733006dfa12) - extra_hosts with host-gateway
- [Docker Compose extra_hosts Configuration](https://oneuptime.com/blog/post/2026-02-08-how-to-use-docker-compose-extrahosts-configuration/view) - extra_hosts syntax
- [Docker Volumes and node_modules](https://justinecodez.medium.com/docker-volumes-and-the-node-modules-conundrum-fef34c230225) - Anonymous volume pattern

### Tertiary (LOW confidence)
- Turbopack Docker compatibility -- based on Phase 10 experience (TURBOPACK=0 was needed), not independently verified for dev mode

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, uses existing node:22-bookworm-slim and established patterns
- Architecture: HIGH - volume mount patterns and docker-compose dev setup are well-documented
- Pitfalls: HIGH - each pitfall is based on verified project-specific issues (better-sqlite3, Windows/WSL2) or widely documented Docker patterns
- Ollama connectivity: HIGH - extra_hosts + host-gateway is the documented Docker solution

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable infrastructure patterns, unlikely to change)
