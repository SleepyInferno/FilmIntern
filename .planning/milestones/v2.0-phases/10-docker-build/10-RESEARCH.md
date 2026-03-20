# Phase 10: Docker Build - Research

**Researched:** 2026-03-19
**Domain:** Docker containerization of Next.js 16 app with better-sqlite3 native addon
**Confidence:** HIGH

## Summary

This phase containerizes a Next.js 16.1.6 application that uses better-sqlite3 (native C++ addon) and pdf-parse into a production Docker image. The key challenges are: (1) compiling native addons in a builder stage while keeping the runner stage minimal, (2) ensuring Next.js standalone output correctly traces and includes native `.node` binaries, and (3) configuring data paths (SQLite DB + settings file) to be volume-mountable.

The official Next.js with-docker example provides the canonical three-stage Dockerfile pattern (deps, builder, runner). The project's use of `serverExternalPackages` for better-sqlite3 means the NFT tracer may not automatically include the native binary -- `outputFileTracingIncludes` should be used as a safety net. The `node:22-bookworm-slim` base image includes curl (verified from the official Dockerfile), so HEALTHCHECK can use curl directly.

**Primary recommendation:** Follow the official Vercel three-stage Dockerfile pattern, add build-essential + python3 in the deps stage for native addon compilation, use `outputFileTracingIncludes` to guarantee better-sqlite3 binary inclusion, and install curl in the runner stage only if slim strips it (it does not for bookworm-slim).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Settings file (`.filmintern/settings.json`) must move to `/app/data/.filmintern/settings.json` inside the container
- Shares the same `/app/data` volume as SQLite -- one volume mount covers both DB and settings
- Settings dir is hardcoded to `/app/data/.filmintern` via Dockerfile `ENV SETTINGS_DIR=/app/data/.filmintern` (not a user-facing env var)
- Code change required: `src/lib/ai/settings.ts` must read `SETTINGS_DIR` env var and fall back to current behavior for non-Docker usage
- Both `DATABASE_PATH` and `SETTINGS_DIR` default to `/app/data/...` in the Dockerfile; in local dev without Docker, existing `process.cwd()` behavior is preserved
- `/api/health` returns `{ status: "ok", version: "0.1.0", db: "connected" }`
- Version comes from `package.json` version field (read at build time or import)
- DB connectivity is verified -- runs a lightweight SQLite query (e.g., `SELECT 1`)
- Returns `200` when healthy; returns `503` with `{ status: "error", db: "failed" }` if DB check fails
- Dockerfile `HEALTHCHECK` uses `CMD curl --fail http://localhost:${PORT}/api/health`
- `ENV PORT=3000` set in Dockerfile as the default
- `EXPOSE 3000` in Dockerfile (documents the default)
- Next.js respects `PORT` env var natively -- user can override with `-e PORT=8080` at runtime
- .dockerignore required exclusions: `node_modules/`, `.next/`, `.git/`
- Additional exclusions: `.planning/`, `analysis_prompts/`, `*.md`, `README.md`
- Security exclusions: `.env`, `.env.local`, `.env*.local`
- Data exclusions: `dev.db`, `*.db-shm`, `*.db-wal`
- Test files (`coverage/`, `vitest.config.ts`, `__tests__/`) are NOT excluded

### Claude's Discretion
- Exact multi-stage build structure (builder + runner stages, layer ordering for cache efficiency)
- How `better-sqlite3` native addon is compiled in the builder stage (build-essential, python3-dev, etc.)
- How version is read from package.json in the health check (import vs. build-time env)
- Exact HEALTHCHECK timing parameters (interval, timeout, retries, start-period)
- Whether `.filmintern` data dir is created with `mkdir -p` in Dockerfile or entrypoint

### Deferred Ideas (OUT OF SCOPE)
- None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOCK-01 | App builds successfully via multi-stage Dockerfile using node:22-bookworm-slim base | Three-stage pattern documented; native addon compilation approach verified |
| DOCK-02 | next.config.ts configured with `output: 'standalone'` producing a minimal production image | Official Next.js docs confirm standalone + outputFileTracingIncludes for native addons |
| DOCK-03 | .dockerignore excludes node_modules, .next, .git from build context | User decisions define exact exclusion list |
| DOCK-04 | SQLite file path is configurable via DATABASE_PATH env var (not hardcoded to cwd) | Code change in db.ts line 4 is trivial -- env var fallback pattern documented |
| DOCK-05 | App exposes /api/health returning 200 JSON, HEALTHCHECK directive in Dockerfile | Health endpoint pattern and HEALTHCHECK timing documented; curl confirmed available in base image |
| DOCK-06 | Container runs as non-root 'nextjs' user (uid 1001) | Official example uses `node` user; custom user creation pattern documented |

</phase_requirements>

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|-------------|---------|---------|--------------|
| node:22-bookworm-slim | Node 22.x LTS | Base Docker image for deps, builder, and runner stages | Debian glibc required by better-sqlite3; slim reduces image size vs full bookworm |
| Next.js | 16.1.6 | App framework with standalone output mode | Already in use; standalone mode is the official Docker deployment method |
| better-sqlite3 | 12.8.0 | SQLite native addon | Already in use; requires native compilation in Docker builder stage |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| build-essential | C/C++ compilation toolchain | Required in deps/builder stage only for better-sqlite3 native addon |
| python3 | Node-gyp build dependency | Required by node-gyp for native addon compilation |
| curl | Health check probe | Pre-installed in node:22-bookworm-slim; used by HEALTHCHECK directive |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:22-bookworm-slim | node:22-alpine | Alpine uses musl libc -- better-sqlite3 requires glibc; bookworm-slim is correct choice |
| curl HEALTHCHECK | wget HEALTHCHECK | Both available in bookworm-slim; curl is more conventional for health checks |
| Three-stage build | Two-stage build | Three stages (deps/builder/runner) give better layer caching when only source changes |

**No new npm dependencies are needed.** All changes are Dockerfile, .dockerignore, next.config.ts, and two small code edits.

## Architecture Patterns

### Recommended Dockerfile Structure
```
Dockerfile
├── Stage 1: deps        # Install ALL node_modules + compile native addons
├── Stage 2: builder     # Copy source + build Next.js (output: standalone)
└── Stage 3: runner      # Minimal image: standalone output + public + static
```

### Pattern 1: Three-Stage Multi-Stage Build
**What:** Separate dependency installation, build, and runtime into isolated stages.
**When to use:** Always for Next.js standalone Docker builds.

```dockerfile
# Source: Official Next.js with-docker example (verified 2026-03-19)
# https://github.com/vercel/next.js/tree/canary/examples/with-docker

# Stage 1: Install dependencies (cached unless package-lock changes)
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential python3 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Stage 2: Build the application
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Production runtime
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# ... copy standalone output, set user, etc.
```

### Pattern 2: Native Addon Safety Net with outputFileTracingIncludes
**What:** Explicitly tell Next.js NFT tracer to include native `.node` binaries.
**When to use:** When using `serverExternalPackages` with native addons (better-sqlite3, sharp, etc.).

```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdf-parse', 'better-sqlite3'],
  outputFileTracingIncludes: {
    '/*': ['node_modules/better-sqlite3/**/*'],
  },
};
```

**Why this matters:** `serverExternalPackages` opts packages out of bundling, which means NFT must trace them separately. The `outputFileTracingIncludes` glob ensures the `.node` binary and its dependencies end up in `.next/standalone/node_modules/`.

### Pattern 3: Environment Variable Fallback for Path Configuration
**What:** Code reads an env var and falls back to `process.cwd()` for local dev.
**When to use:** For DATABASE_PATH and SETTINGS_DIR.

```typescript
// db.ts - line 4 change
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'dev.db');

// settings.ts - line 18 change
const SETTINGS_DIR = process.env.SETTINGS_DIR || path.join(process.cwd(), '.filmintern');
```

### Pattern 4: Non-Root User with Specific UID
**What:** Create a dedicated user instead of using the built-in `node` user, for consistency with Kubernetes/Compose expectations.
**When to use:** When the requirement specifies a specific uid (1001).

```dockerfile
# In runner stage
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Create data directory owned by nextjs user
RUN mkdir -p /app/data/.filmintern && chown -R nextjs:nodejs /app/data

USER nextjs
```

### Pattern 5: Health Check API Route
**What:** Next.js App Router API route that verifies DB connectivity.
**When to use:** For DOCK-05.

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Import db module and run a lightweight query
    const { db } = await import('@/lib/db');
    db.listProjects(); // or a raw SELECT 1 via getDb()

    return NextResponse.json({
      status: 'ok',
      version: process.env.npm_package_version || '0.1.0',
      db: 'connected'
    });
  } catch {
    return NextResponse.json(
      { status: 'error', db: 'failed' },
      { status: 503 }
    );
  }
}
```

**Note on version:** `process.env.npm_package_version` is NOT available in standalone mode (no package.json at runtime). Recommended approach: read version at build time. Options:
1. Import `package.json` directly: `import pkg from '../../../package.json'` -- works but path is fragile
2. Use a build-time env: `ARG APP_VERSION` in Dockerfile, then `ENV APP_VERSION=$APP_VERSION` -- clean but adds a build arg
3. Hardcode in the route and update manually -- simplest for a personal tool at v0.1.0

**Recommendation:** Use `import pkg from '../../../../package.json' assert { type: 'json' }` relative path or create a simple version constant. For a personal tool, a hardcoded constant in a shared file (e.g., `src/lib/version.ts`) that exports the version is the most maintainable approach.

### Anti-Patterns to Avoid
- **Copying node_modules from host into container:** Host binaries are compiled for a different OS/arch. Always `npm ci` inside the container.
- **Using `npm install` instead of `npm ci`:** `npm install` can modify package-lock.json; `npm ci` ensures reproducible builds.
- **Running as root in production:** Security risk; always switch to non-root user after setup.
- **Baking `.env` files into the image:** Secrets leak into image layers; use runtime env vars instead.
- **Installing dev dependencies in runner stage:** The runner stage should only contain the standalone output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Standalone output tracing | Manual file copying scripts | `output: 'standalone'` in next.config.ts | NFT tracer handles 99% of cases; outputFileTracingIncludes covers edge cases |
| Native addon compilation | Custom build scripts | `build-essential` + `python3` + `npm ci` | node-gyp handles compilation automatically during npm install |
| Health check scheduling | Custom cron or polling | Docker HEALTHCHECK directive | Built into Docker; integrates with orchestrators |
| Process management | PM2 or supervisor | `node server.js` directly | Next.js standalone server handles graceful shutdown; single-process container is idiomatic |

**Key insight:** The entire Docker build requires zero new npm packages. All complexity is in the Dockerfile and two one-line code changes.

## Common Pitfalls

### Pitfall 1: better-sqlite3 Binary Not Found in Standalone Output
**What goes wrong:** `Error: Cannot find module 'better-sqlite3'` at container runtime.
**Why it happens:** `serverExternalPackages` opts the package out of webpack bundling, but NFT may not trace the native `.node` binary correctly, especially for transitive native dependencies.
**How to avoid:** Add `outputFileTracingIncludes: { '/*': ['node_modules/better-sqlite3/**/*'] }` to next.config.ts. After building, verify the binary exists: `ls .next/standalone/node_modules/better-sqlite3/build/Release/better_sqlite3.node`.
**Warning signs:** Build succeeds but container crashes immediately on first DB access.

### Pitfall 2: HOSTNAME Not Set -- Server Unreachable
**What goes wrong:** Container starts but health checks fail; app only listens on 127.0.0.1.
**Why it happens:** Next.js standalone server defaults to listening on localhost (127.0.0.1), not all interfaces.
**How to avoid:** Set `ENV HOSTNAME="0.0.0.0"` in the Dockerfile runner stage.
**Warning signs:** `curl http://localhost:3000` works inside the container but external access fails.

### Pitfall 3: Missing public/ and .next/static/ in Runner
**What goes wrong:** App loads but all static assets (images, CSS, JS chunks) return 404.
**Why it happens:** The standalone output does NOT include `public/` or `.next/static/` by default. These must be copied manually in the Dockerfile.
**How to avoid:** Two explicit COPY commands in the runner stage:
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
```
**Warning signs:** HTML loads but page is unstyled/broken.

### Pitfall 4: SQLite Permission Denied on Volume Mount
**What goes wrong:** `SQLITE_CANTOPEN: unable to open database file` at runtime.
**Why it happens:** The host directory mounted at `/app/data` is owned by root, but the container runs as uid 1001.
**How to avoid:** Create `/app/data` in the Dockerfile and `chown` it to the nextjs user. Document that the host must either pre-create the directory with correct permissions or the container needs write access.
**Warning signs:** Works with `docker run --user root` but fails with the default non-root user.

### Pitfall 5: Build Context Too Large / Slow Builds
**What goes wrong:** `docker build` takes minutes and sends gigabytes of context.
**Why it happens:** Missing or incomplete `.dockerignore` -- node_modules (hundreds of MB), .next, .git all get sent.
**How to avoid:** Create .dockerignore FIRST, before the first build attempt. Verify with `docker build` output showing context size.
**Warning signs:** "Sending build context to Docker daemon XXX MB" where XXX > 10.

### Pitfall 6: Node.js Version Mismatch for Native Addon
**What goes wrong:** `MODULE_NOT_FOUND` or `was compiled against a different Node.js version`.
**Why it happens:** builder stage uses a different Node.js version than the runner stage.
**How to avoid:** Use the SAME base image (node:22-bookworm-slim) for ALL three stages. Use an ARG at the top for the version.
**Warning signs:** Build succeeds but crash at runtime with version mismatch error.

## Code Examples

### Complete .dockerignore
```
# Source: User decisions from CONTEXT.md
node_modules/
.next/
.git/

# Dev/planning files
.planning/
analysis_prompts/
*.md
README.md

# Secrets - never bake into image
.env
.env.local
.env*.local

# Local database files
dev.db
*.db-shm
*.db-wal
```

### Complete next.config.ts (after changes)
```typescript
// Source: Next.js docs - output standalone + outputFileTracingIncludes
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdf-parse', 'better-sqlite3'],
  outputFileTracingIncludes: {
    '/*': ['node_modules/better-sqlite3/**/*'],
  },
};

export default nextConfig;
```

### HEALTHCHECK Directive
```dockerfile
# Source: Docker best practices + user decision on curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl --fail http://localhost:${PORT:-3000}/api/health || exit 1
```

**Timing rationale:**
- `--start-period=40s`: Next.js standalone cold start + SQLite init can take 10-30s; 40s gives headroom
- `--interval=30s`: Standard interval; not too aggressive for a personal tool
- `--timeout=10s`: Health endpoint should respond in <1s; 10s is generous
- `--retries=3`: Three consecutive failures before marking unhealthy

### Data Directory Setup in Dockerfile
```dockerfile
# Create data directory structure in runner stage
ENV DATABASE_PATH=/app/data/filmintern.db
ENV SETTINGS_DIR=/app/data/.filmintern

RUN mkdir -p /app/data/.filmintern && chown -R nextjs:nodejs /app/data
```

**Recommendation:** Use `mkdir -p` in the Dockerfile (not an entrypoint script). It is simpler, more declarative, and the directory structure is fixed. An entrypoint script adds unnecessary complexity for this use case.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full node_modules in image | `output: 'standalone'` with NFT tracing | Next.js 12+ (2022) | Image size drops from ~1GB to ~150-300MB |
| Alpine for small images | Debian bookworm-slim | 2023+ for native addons | glibc compatibility; similar size to Alpine with fewer issues |
| PM2 process manager | Direct `node server.js` | Docker best practices | Single-process containers; orchestrator handles restarts |
| `next start` in container | `node server.js` (standalone) | Next.js 12+ | No need for `next` CLI in production image |

**Deprecated/outdated:**
- `serverless` output target: removed in Next.js 12; replaced by `standalone`
- `experimental.outputStandalone`: moved to stable `output: 'standalone'` in Next.js 12.2
- Alpine-based images for native addons: causes glibc/musl issues; bookworm-slim is the standard

## Open Questions

1. **Does NFT correctly trace better-sqlite3 with serverExternalPackages in Next.js 16.1.6?**
   - What we know: `outputFileTracingIncludes` is the documented safety net; `serverExternalPackages` may interfere with tracing
   - What's unclear: Whether the include glob is actually needed or if NFT handles it automatically in v16
   - Recommendation: Add `outputFileTracingIncludes` as a safety measure; verify after first build by checking `.next/standalone/node_modules/better-sqlite3/build/Release/better_sqlite3.node` exists

2. **Exact image size with all dependencies**
   - What we know: Standalone images typically 150-300MB; node:22-bookworm-slim base is ~60MB
   - What's unclear: Impact of better-sqlite3 native binary + pdf-parse on final size
   - Recommendation: Verify after build; the 300MB requirement should be achievable

3. **Version reading in standalone mode**
   - What we know: `process.env.npm_package_version` is NOT available in standalone (no package.json context)
   - What's unclear: Whether `import pkg from 'package.json'` works in standalone trace
   - Recommendation: Create `src/lib/version.ts` exporting a const; simplest and most reliable

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCK-01 | Docker image builds successfully | smoke (manual) | `docker build -t filmintern .` | N/A -- Docker command, not unit test |
| DOCK-02 | Standalone output produced | smoke (manual) | `npm run build && ls .next/standalone/server.js` | N/A -- build verification |
| DOCK-03 | Build context excludes large dirs | smoke (manual) | `docker build .` and check context size < 50MB | N/A -- Docker command |
| DOCK-04 | DATABASE_PATH env var works | unit | `npx vitest run src/lib/__tests__/db-path.test.ts -x` | No -- Wave 0 |
| DOCK-05 | /api/health returns 200 JSON | integration | `docker run -d filmintern && curl http://localhost:3000/api/health` | No -- Wave 0 |
| DOCK-06 | Container runs as non-root uid 1001 | smoke (manual) | `docker run filmintern whoami` or `docker run filmintern id` | N/A -- Docker command |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (existing tests still pass)
- **Per wave merge:** Full vitest suite + `docker build -t filmintern . && docker run --rm filmintern id && docker run -d --name fi-test -p 3000:3000 filmintern && sleep 5 && curl http://localhost:3000/api/health && docker stop fi-test`
- **Phase gate:** Full suite green + successful Docker build + health check response verified

### Wave 0 Gaps
- [ ] `src/lib/__tests__/db-path.test.ts` -- unit test verifying DATABASE_PATH env var fallback (covers DOCK-04)
- [ ] `src/lib/ai/__tests__/settings-dir.test.ts` -- unit test verifying SETTINGS_DIR env var fallback
- [ ] No framework install needed -- vitest already configured

Note: Most DOCK requirements are verified via Docker commands (smoke tests), not unit tests. The unit tests cover the two code changes (db.ts and settings.ts env var fallback logic).

## Sources

### Primary (HIGH confidence)
- [Next.js official deploying docs](https://nextjs.org/docs/app/getting-started/deploying) -- Docker deployment guidance, standalone mode
- [Next.js output config docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) -- outputFileTracingIncludes, standalone details, HOSTNAME/PORT
- [Official Next.js with-docker example](https://github.com/vercel/next.js/tree/canary/examples/with-docker) -- Three-stage Dockerfile pattern (verified Dockerfile content)
- [node:22-bookworm-slim Dockerfile](https://github.com/nodejs/docker-node/blob/258c1a40754047657c4d8cdb6df5042785584821/22/bookworm-slim/Dockerfile) -- Confirms curl/wget pre-installed
- [nodejs/docker-node#1185](https://github.com/nodejs/docker-node/issues/1185) -- curl availability in slim images

### Secondary (MEDIUM confidence)
- [better-sqlite3 Docker discussions](https://github.com/WiseLibs/better-sqlite3/discussions/1270) -- Alpine vs Debian for native addon
- [DEV Community: Optimizing Next.js Docker Images](https://dev.to/angojay/optimizing-nextjs-docker-images-with-standalone-mode-2nnh) -- Image size benchmarks

### Tertiary (LOW confidence)
- [OneUptime blog: Docker Next.js](https://oneuptime.com/blog/post/2026-02-17-how-to-build-a-docker-image-for-a-nextjs-application-with-standalone-output-and-deploy-to-cloud-run/view) -- General patterns, cross-verified with official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- base image and build tools are well-documented; no new npm dependencies
- Architecture: HIGH -- three-stage pattern is the official Vercel recommendation; all code changes are one-liners
- Pitfalls: HIGH -- native addon Docker issues are extensively documented in the community; all mitigations are verified
- Validation: MEDIUM -- unit tests for env var fallbacks are straightforward; Docker smoke tests require running Docker

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain; Docker + Next.js standalone patterns rarely change)
