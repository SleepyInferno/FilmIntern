# Phase 12: Production Deployment - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Provide a production deployment configuration for self-hosted use on Unraid. Deliverables: `docker-compose.prod.yml` (Caddy + app as a single importable file for Docker Compose Manager) and a `Caddyfile` (reverse proxy config with streaming support). No new application code — pure infrastructure. HTTPS and CI/CD are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Domain / HTTPS approach
- LAN-only access — no HTTPS, no TLS certificates needed
- Caddy listens on port **7430** and reverse proxies to the app container
- Access URL on Unraid: `http://unraid-ip:7430`
- No Let's Encrypt or self-signed cert config required for this phase
- If HTTPS is added later, it's a Caddyfile-only change (swap `:7430` for a real domain)

### Image source
- Production image: `ghcr.io/sleepyinferno/filmintern:latest`
- Repository is **private** — Unraid must authenticate to pull
- Setup doc must include: create GitHub PAT with `read:packages` scope, then `docker login ghcr.io -u sleepyinferno --password-stdin`
- Phase 13 (CI/CD) handles publishing the image; this phase references the path

### Unraid data paths
- Host path: `/mnt/user/appdata/filmintern` (standard Unraid appdata convention — survives array restarts, included in Unraid backups)
- Container path: `/app/data` (covers both SQLite DB and `.filmintern/` settings dir)
- Container runs as uid 1001 (`nextjs` user) — setup doc must include first-run chown:
  `mkdir -p /mnt/user/appdata/filmintern && chown -R 1001:1001 /mnt/user/appdata/filmintern`

### Compose topology
- Single `docker-compose.prod.yml` with two services: `caddy` and `app`
- One file to import into Docker Compose Manager — both services start together
- `caddy` image: `caddy:2-alpine`
- `app` image: `ghcr.io/sleepyinferno/filmintern:latest`
- Caddyfile mounted into the Caddy container from the repo: `./Caddyfile:/etc/caddy/Caddyfile`
- Named volume `caddy_data` for Caddy's internal cert/config storage (lightweight, not user data)
- App container NOT exposed to host — only Caddy port 7430 is published

### Streaming / SSE through Caddy
- Analysis routes use `toTextStreamResponse()` (AI SDK) — returns chunked transfer encoding, not SSE
- Caddy must disable response buffering: `flush_interval -1` in the reverse_proxy directive
- Affected routes: `/api/analyze*`, `/api/image-prompts/generate`
- Without `flush_interval -1`, Caddy will buffer chunks and the UI will appear frozen until analysis completes

### Claude's Discretion
- Exact Caddy reverse_proxy directive structure (header handling, timeouts)
- Whether to add `encode gzip` for non-streaming responses
- Named network setup between Caddy and app containers
- Docker Compose healthcheck integration (wait for app to be healthy before Caddy starts)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — PROD-01 (Caddyfile for HTTPS/domain routing) and PROD-02 (SSE streaming works through proxy)

### Existing infrastructure
- `Dockerfile` — Production multi-stage build, exposes port 3000, runs as uid 1001 nextjs user, HEALTHCHECK defined
- `docker-compose.yml` — Dev compose (reference for service/volume patterns — do NOT modify, prod gets its own file)

### No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Dockerfile` — Already complete production image; prod compose just references it (no changes needed)
- `/api/health` route — Returns 200 JSON; Caddy can use this for upstream health checking

### Established Patterns
- Dev compose uses `./data:/app/data` bind mount — prod uses `/mnt/user/appdata/filmintern:/app/data` (same mount target, different host path)
- `SETTINGS_DIR` and `DATABASE_PATH` env vars already supported — just need to set them in prod compose environment block

### Integration Points
- App container port 3000 is the upstream target for Caddy's `reverse_proxy`
- Three streaming endpoints need `flush_interval -1`: `/api/analyze`, `/api/analyze/critic`, `/api/image-prompts/generate` — or apply globally to all proxied routes

</code_context>

<specifics>
## Specific Ideas

- Unraid's Docker Compose Manager imports a single compose file — the one-file topology is the direct import path
- The uid 1001 chown requirement is a known gotcha (documented in STATE.md blockers from Phase 11) — must be in setup docs
- Private GHCR auth is a first-run step; document it clearly so the user isn't blocked at `docker compose up`

</specifics>

<deferred>
## Deferred Ideas

- HTTPS with real domain — straightforward Caddyfile change when ready; no code changes needed
- Cloudflare Tunnel support — different Caddy config, own phase if needed
- Unraid Community Applications template XML (CI-05) — deferred to Phase 13

</deferred>

---

*Phase: 12-production-deployment*
*Context gathered: 2026-03-19*
