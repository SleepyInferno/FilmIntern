# Phase 12: Production Deployment - Research

**Researched:** 2026-03-19
**Domain:** Caddy reverse proxy + Docker Compose production deployment on Unraid
**Confidence:** HIGH

## Summary

Phase 12 delivers two files: `docker-compose.prod.yml` and `Caddyfile`. The compose file defines two services (Caddy + app) importable as a single stack into Unraid's Docker Compose Manager. The Caddyfile configures Caddy as an HTTP reverse proxy on port 7430 with streaming support for AI analysis endpoints.

The technical surface is small and well-documented. Caddy v2's `reverse_proxy` directive with `flush_interval -1` handles streaming. The only significant pitfall is the interaction between `encode gzip` and SSE/streaming responses -- Caddy's compression module can buffer streaming chunks, breaking real-time delivery. The safest approach is to apply `flush_interval -1` globally and either skip `encode gzip` entirely or carefully exclude streaming paths.

**Primary recommendation:** Keep the Caddyfile minimal -- reverse proxy with `flush_interval -1` applied globally, no `encode gzip`. Two files, no application code changes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- LAN-only access -- no HTTPS, no TLS certificates needed
- Caddy listens on port 7430 and reverse proxies to the app container
- Access URL on Unraid: `http://unraid-ip:7430`
- Production image: `ghcr.io/sleepyinferno/filmintern:latest` (private repo, requires GHCR auth)
- Host path: `/mnt/user/appdata/filmintern` mapped to container `/app/data`
- Container runs as uid 1001 (`nextjs` user) -- setup doc must include chown instructions
- Single `docker-compose.prod.yml` with two services: `caddy` and `app`
- `caddy` image: `caddy:2-alpine`
- Caddyfile mounted into Caddy container from repo: `./Caddyfile:/etc/caddy/Caddyfile`
- Named volume `caddy_data` for Caddy internal storage
- App container NOT exposed to host -- only Caddy port 7430 is published
- Streaming routes need `flush_interval -1` in reverse_proxy directive

### Claude's Discretion
- Exact Caddy reverse_proxy directive structure (header handling, timeouts)
- Whether to add `encode gzip` for non-streaming responses
- Named network setup between Caddy and app containers
- Docker Compose healthcheck integration (wait for app to be healthy before Caddy starts)

### Deferred Ideas (OUT OF SCOPE)
- HTTPS with real domain -- straightforward Caddyfile change when ready
- Cloudflare Tunnel support -- different Caddy config, own phase if needed
- Unraid Community Applications template XML (CI-05) -- deferred to Phase 13
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROD-01 | Caddyfile config provided for automatic HTTPS and domain routing | Caddyfile with `:7430` listener + reverse_proxy to app:3000. HTTPS is a future Caddyfile-only change (swap port for domain). Architecture patterns section covers full Caddyfile structure. |
| PROD-02 | Streaming AI analysis (SSE) works correctly through the Caddy reverse proxy | `flush_interval -1` in reverse_proxy directive disables buffering. Only `/api/analyze` and `/api/analyze/critic` use streaming (`toTextStreamResponse`). Pitfalls section covers gzip interaction. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| caddy | 2-alpine (currently 2.11.x) | Reverse proxy | Official Docker image, automatic HTTPS, minimal config, built-in streaming support |
| docker compose | v2.24+ | Container orchestration | Already used in dev; Unraid Docker Compose Manager requires compose file format |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | - | No additional libraries -- pure infrastructure config |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `encode gzip` | No compression | Avoids known SSE/streaming buffering issue (GitHub #6293). LAN-only deployment means bandwidth is not a concern. Recommended: skip gzip. |
| Caddy active health checks | Docker Compose `depends_on` with `condition: service_healthy` | Compose-level health dependency is simpler and sufficient for a 2-service stack. Caddy active health checks add complexity without benefit here. |

## Architecture Patterns

### Recommended Project Structure
```
project-root/
  docker-compose.prod.yml    # Production compose (Caddy + app)
  Caddyfile                  # Caddy reverse proxy config
  Dockerfile                 # Existing -- no changes
  docker-compose.yml         # Existing dev compose -- no changes
```

### Pattern 1: Caddyfile for HTTP Reverse Proxy with Streaming
**What:** Minimal Caddyfile that listens on port 7430 and proxies all requests to the app container on port 3000 with streaming support.
**When to use:** Always -- this is the core deliverable.
**Example:**
```caddyfile
# Source: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
:7430 {
	reverse_proxy app:3000 {
		flush_interval -1
	}
}
```

Key details:
- `:7430` binds to all interfaces on port 7430 (no domain = HTTP only, no automatic HTTPS)
- `app` resolves via Docker Compose's built-in DNS (service name)
- `flush_interval -1` enables low-latency mode: flushes immediately after each write, disabling response buffering entirely
- This applies to ALL proxied responses, which is safe and simple -- non-streaming responses are unaffected by immediate flushing

### Pattern 2: Docker Compose with Health-Based Dependency
**What:** Caddy waits for the app to be healthy before starting to accept traffic.
**When to use:** Production deployment where startup order matters.
**Example:**
```yaml
services:
  app:
    image: ghcr.io/sleepyinferno/filmintern:latest
    # HEALTHCHECK is defined in the Dockerfile
    # No ports exposed to host -- Caddy handles external access
    volumes:
      - /mnt/user/appdata/filmintern:/app/data
    environment:
      - DATABASE_PATH=/app/data/filmintern.db
      - SETTINGS_DIR=/app/data/.filmintern
    networks:
      - internal

  caddy:
    image: caddy:2-alpine
    ports:
      - "7430:7430"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
    depends_on:
      app:
        condition: service_healthy
    networks:
      - internal

volumes:
  caddy_data:

networks:
  internal:
```

Key details:
- `depends_on` with `condition: service_healthy` uses the existing HEALTHCHECK in the Dockerfile (curl to `/api/health`)
- Named network `internal` is explicit but functionally equivalent to the default compose network -- included for clarity
- `caddy_data` named volume stores Caddy's internal state (cert storage, config cache) -- lightweight, not user data
- Caddyfile mounted read-only (`:ro`)
- App container has NO `ports` directive -- only reachable through Caddy

### Pattern 3: Ollama Host Access from Production
**What:** If the user runs Ollama on the Unraid host, the app container needs access.
**When to use:** When Ollama is the configured AI provider.
**Example:**
```yaml
services:
  app:
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434/api
```

Note: This matches the dev compose pattern. On Docker Desktop (Windows/Mac) `host.docker.internal` works natively. On Linux (including Unraid), `extra_hosts` with `host-gateway` is required.

### Anti-Patterns to Avoid
- **Exposing app port to host alongside Caddy:** Defeats the purpose of the reverse proxy. Only Caddy's port 7430 should be published.
- **Using `encode gzip` with streaming routes:** Known Caddy issue (#6293) where compression buffers SSE/chunked responses, breaking real-time delivery. On a LAN, gzip adds latency without meaningful bandwidth savings.
- **Hardcoding IP addresses in Caddyfile:** Use Docker service names (`app`) which resolve via internal DNS. IPs change across restarts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Container startup ordering | Custom wait scripts or sleep loops | `depends_on: condition: service_healthy` | Docker Compose v2.24+ handles this natively with the existing HEALTHCHECK |
| Internal DNS resolution | Manual IP assignment or links | Docker Compose default network | Service names resolve automatically within the same compose stack |
| SSL termination | Self-signed cert generation scripts | Caddy's built-in ACME (future phase) | Just swap `:7430` for a domain name in the Caddyfile when ready |

## Common Pitfalls

### Pitfall 1: encode gzip Breaks Streaming Responses
**What goes wrong:** Adding `encode gzip` to the Caddyfile causes AI analysis responses to appear frozen until completion. The compression module buffers chunks before flushing.
**Why it happens:** Caddy's encode module and flush_interval interact poorly for streaming responses. This is a known open issue (GitHub #6293, reported against Caddy 2.7.6+, still open as of March 2026).
**How to avoid:** Do not use `encode gzip` in this deployment. LAN bandwidth makes compression unnecessary.
**Warning signs:** Analysis UI shows no progress, then dumps all text at once.

### Pitfall 2: Host Directory Permissions (uid 1001)
**What goes wrong:** App container fails to start or crashes on first database write because `/mnt/user/appdata/filmintern` is owned by root.
**Why it happens:** Container runs as uid 1001 (nextjs user). Host directory created by `mkdir` defaults to root ownership.
**How to avoid:** Setup documentation must include:
```bash
mkdir -p /mnt/user/appdata/filmintern
chown -R 1001:1001 /mnt/user/appdata/filmintern
```
**Warning signs:** "SQLITE_CANTOPEN" or "EACCES" errors in container logs.

### Pitfall 3: Private GHCR Image Pull Failure
**What goes wrong:** `docker compose up` fails with "manifest unknown" or authentication error.
**Why it happens:** Repository is private; Docker needs GHCR credentials before pulling.
**How to avoid:** Setup documentation must include:
```bash
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u sleepyinferno --password-stdin
```
PAT needs `read:packages` scope.
**Warning signs:** "unauthorized" or "denied" in pull output.

### Pitfall 4: Caddy Data Volume Confusion
**What goes wrong:** User mounts Caddyfile to `/data` instead of `/etc/caddy/Caddyfile`, or confuses `caddy_data` volume with application data.
**Why it happens:** Caddy uses `/data` internally for certificate storage and state. The Caddyfile goes to `/etc/caddy/Caddyfile`.
**How to avoid:** Clear comments in docker-compose.prod.yml distinguishing the two mount points.

### Pitfall 5: Streaming Route Misidentification
**What goes wrong:** Assuming `/api/image-prompts/generate` needs streaming support.
**Why it happens:** The CONTEXT.md lists it as a streaming endpoint, but code inspection shows it uses `generateText()` (not `streamText()`), returning a standard JSON response.
**How to avoid:** Only `/api/analyze` and `/api/analyze/critic` use `toTextStreamResponse()`. The `flush_interval -1` applied globally handles them without needing route-specific config.
**Impact:** None -- global `flush_interval -1` is harmless for non-streaming routes, so this is informational only.

## Code Examples

### Complete Caddyfile
```caddyfile
# Production reverse proxy for FilmIntern
# Listens on port 7430 (HTTP only, LAN access)
# To enable HTTPS later: replace ":7430" with your domain name

:7430 {
	reverse_proxy app:3000 {
		flush_interval -1
	}
}
```

### Complete docker-compose.prod.yml
```yaml
# Production deployment for Unraid Docker Compose Manager
# Prerequisites:
#   1. docker login ghcr.io -u sleepyinferno --password-stdin
#   2. mkdir -p /mnt/user/appdata/filmintern && chown -R 1001:1001 /mnt/user/appdata/filmintern

services:
  app:
    image: ghcr.io/sleepyinferno/filmintern:latest
    volumes:
      - /mnt/user/appdata/filmintern:/app/data
    environment:
      - DATABASE_PATH=/app/data/filmintern.db
      - SETTINGS_DIR=/app/data/.filmintern
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped
    networks:
      - internal

  caddy:
    image: caddy:2-alpine
    ports:
      - "7430:7430"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
    depends_on:
      app:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - internal

volumes:
  caddy_data:

networks:
  internal:
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nginx + manual SSL | Caddy automatic HTTPS | Caddy v2 (2020+) | Zero-config TLS when domain is used |
| `links:` in compose | Default DNS resolution | Compose v2 | Service names resolve automatically |
| Custom healthcheck scripts | `depends_on: condition: service_healthy` | Compose v2.24 (2024) | Native health-based startup ordering |

## Open Questions

1. **Caddy active health checks vs. passive**
   - What we know: `depends_on: service_healthy` ensures app is up before Caddy starts. Caddy also supports `health_uri` for ongoing monitoring.
   - What's unclear: Whether Caddy active health checks add value for a single-upstream deployment.
   - Recommendation: Skip Caddy-level health checks. Compose handles startup. If the app crashes, Docker's `restart: unless-stopped` handles recovery. Keep config minimal.

2. **Ollama connectivity on Unraid specifically**
   - What we know: `extra_hosts: host.docker.internal:host-gateway` works on standard Linux Docker.
   - What's unclear: Whether Unraid's Docker implementation (based on Docker Engine but with custom networking) handles `host-gateway` identically.
   - Recommendation: Include `extra_hosts` in the compose file (matches dev pattern). Note in setup docs that Ollama URL may need adjustment if Unraid networking differs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual integration testing (no automated test framework for infrastructure config) |
| Config file | N/A -- infrastructure files, not application code |
| Quick run command | `docker compose -f docker-compose.prod.yml config` (validates compose syntax) |
| Full suite command | Manual: `docker compose -f docker-compose.prod.yml up -d` then `curl http://localhost:7430/api/health` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROD-01 | Caddyfile configures reverse proxy on port 7430 | smoke | `docker compose -f docker-compose.prod.yml config` (validates syntax) | N/A -- new file |
| PROD-02 | Streaming AI analysis works through Caddy proxy | manual-only | Requires running AI provider + sending analysis request through proxy | N/A -- manual verification |

**Manual-only justification for PROD-02:** Streaming verification requires an active AI provider (API key or Ollama) and a real analysis request. Cannot be automated in CI without external dependencies.

### Sampling Rate
- **Per task commit:** `docker compose -f docker-compose.prod.yml config` (syntax validation)
- **Per wave merge:** Manual smoke test with `curl http://localhost:7430/api/health`
- **Phase gate:** Full manual test: submit analysis through `http://localhost:7430`, verify streaming output appears progressively

### Wave 0 Gaps
None -- this phase creates new infrastructure files, not application code. No test framework setup needed.

## Sources

### Primary (HIGH confidence)
- [Caddy reverse_proxy documentation](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) - flush_interval, health checks, transport options
- [Caddy Docker Hub](https://hub.docker.com/_/caddy) - Official image tags, currently 2.11.x for `2-alpine`
- Project source code inspection - Confirmed only `/api/analyze` and `/api/analyze/critic` use `toTextStreamResponse()`; `/api/image-prompts/generate` uses `generateText()` (non-streaming)

### Secondary (MEDIUM confidence)
- [GitHub Issue #6293](https://github.com/caddyserver/caddy/issues/6293) - encode gzip + SSE conflict, still open as of March 2026
- [GitHub Issue #4247](https://github.com/caddyserver/caddy/issues/4247) - flush_interval SSE buffering documentation

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Caddy and Docker Compose are well-documented, versions verified against Docker Hub
- Architecture: HIGH - Caddyfile syntax and compose patterns verified against official docs and existing project patterns
- Pitfalls: HIGH - gzip/SSE issue confirmed via GitHub issue tracker; uid/permissions issue documented in project STATE.md

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable infrastructure, slow-moving ecosystem)
