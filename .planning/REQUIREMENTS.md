# Requirements: FilmIntern

**Defined:** 2026-03-19
**Core Value:** Upload your material, pick your project type, get a structured analysis back — one tool that replaces hours of manual review across scattered apps.

## v2.0 Requirements (Docker Containerization)

### Docker Build

- [x] **DOCK-01**: App builds successfully via multi-stage Dockerfile using node:22-bookworm-slim base
- [x] **DOCK-02**: next.config.ts configured with `output: 'standalone'` producing a minimal production image
- [x] **DOCK-03**: .dockerignore excludes node_modules, .next, .git from build context
- [x] **DOCK-04**: SQLite file path is configurable via DATABASE_PATH env var (not hardcoded to cwd)
- [x] **DOCK-05**: App exposes /api/health returning 200 JSON, HEALTHCHECK directive in Dockerfile
- [x] **DOCK-06**: Container runs as non-root 'nextjs' user (uid 1001)

### Local Dev

- [ ] **DEV-01**: Developer can start the app with `docker compose up` (no Node.js install required)
- [ ] **DEV-02**: Dev Compose uses bind-mounted source for hot module reload
- [ ] **DEV-03**: SQLite database persists across container restarts via volume mount (./data:/app/data)
- [ ] **DEV-04**: AI provider API keys set via .env file populate the settings UI as defaults
- [x] **DEV-05**: Ollama running on the host is reachable from inside the container

### Production

- [ ] **PROD-01**: Caddyfile config provided for automatic HTTPS and domain routing
- [ ] **PROD-02**: Streaming AI analysis (SSE) works correctly through the Caddy reverse proxy

### CI/CD

- [ ] **CI-01**: GitHub Actions workflow builds and pushes image to GHCR on push to main
- [ ] **CI-02**: CI build uses BuildKit layer caching for fast subsequent builds
- [ ] **CI-03**: Image tagged with git SHA and 'latest' for version tracking and rollback
- [ ] **CI-04**: Image targets linux/amd64 (compatible with Windows Docker Desktop and Unraid x86-64)
- [ ] **CI-05**: Unraid deployment guide provided (template XML or setup instructions for Community Applications)

## Future Requirements

*(None identified — scope is well-defined for v2.0)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-platform image (arm64) | Native addon cross-compilation is slow/fragile; linux/amd64 covers all target platforms |
| Kubernetes / Helm charts | Personal tool — single-container Compose is sufficient |
| Docker Hub push | GHCR is free and integrated with GitHub Actions; Docker Hub not needed for personal use |
| Nginx reverse proxy | Caddy provides automatic HTTPS with far less config — Nginx not needed for this tool |
| Cloud deployment (ECS, GCR, etc.) | Personal/self-hosted focus; cloud deployment out of scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOCK-01 | Phase 10 | Complete |
| DOCK-02 | Phase 10 | Complete |
| DOCK-03 | Phase 10 | Complete |
| DOCK-04 | Phase 10 | Complete |
| DOCK-05 | Phase 10 | Complete |
| DOCK-06 | Phase 10 | Complete |
| DEV-01 | Phase 11 | Pending |
| DEV-02 | Phase 11 | Pending |
| DEV-03 | Phase 11 | Pending |
| DEV-04 | Phase 11 | Pending |
| DEV-05 | Phase 11 | Complete |
| PROD-01 | Phase 12 | Pending |
| PROD-02 | Phase 12 | Pending |
| CI-01 | Phase 13 | Pending |
| CI-02 | Phase 13 | Pending |
| CI-03 | Phase 13 | Pending |
| CI-04 | Phase 13 | Pending |
| CI-05 | Phase 13 | Pending |

**Coverage:**
- v2.0 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
