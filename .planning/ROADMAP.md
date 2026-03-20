# Roadmap: FilmIntern

## Milestones

- [x] **v1.0 MVP** - Phases 1-9, 3.1 (shipped 2026-03-19)
- [ ] **v2.0 Docker Containerization** - Phases 10-13 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-9, 3.1) - SHIPPED 2026-03-19</summary>

- [x] Phase 1: Vertical Slice (3/3 plans) - completed 2026-03-17
- [x] Phase 2: File Format Support (2/2 plans) - completed 2026-03-17
- [x] Phase 3: Analysis Expansion (3/3 plans) - completed 2026-03-17
- [x] Phase 3.1: Multi-Provider AI Support (3/3 plans) - completed 2026-03-17 (INSERTED)
- [x] Phase 4: Export and Document Generation (6/6 plans) - completed 2026-03-17
- [x] Phase 5: UI Theme & Brand System (2/2 plans) - completed 2026-03-18
- [x] Phase 6: Card-Based Analysis Workspaces (5/5 plans) - completed 2026-03-19
- [x] Phase 7: Library & Persistence (2/2 plans) - completed 2026-03-19
- [x] Phase 8: Provider Error Handling (1/1 plan) - completed 2026-03-19
- [x] Phase 9: Harsh Critic Analysis Mode (2/2 plans) - completed 2026-03-19

Archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### v2.0 Docker Containerization (In Progress)

**Milestone Goal:** Package the app for one-command local dev startup and reliable self-hosted deployment.

**Phase Numbering:**
- Integer phases (10, 11, 12, 13): Planned milestone work
- Decimal phases (e.g., 10.1): Urgent insertions if needed

- [x] **Phase 10: Docker Build** - Multi-stage Dockerfile with standalone output, health check, and non-root user (completed 2026-03-19)
- [x] **Phase 11: Local Dev Environment** - Docker Compose for one-command startup with hot reload and persistence (completed 2026-03-19)
- [x] **Phase 12: Production Deployment** - Caddy reverse proxy on port 7430 with streaming support (completed 2026-03-19)
- [x] **Phase 13: CI/CD Pipeline** - GitHub Actions to build, tag, and push images to GHCR (completed 2026-03-20)

## Phase Details

### Phase 10: Docker Build
**Goal**: The application builds into a minimal, secure Docker image that runs correctly in standalone mode
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: DOCK-01, DOCK-02, DOCK-03, DOCK-04, DOCK-05, DOCK-06
**Success Criteria** (what must be TRUE):
  1. Running `docker build .` produces a working image under 300MB using node:22-bookworm-slim base
  2. The built container starts and serves the app on port 3000 with all features functional (file upload, analysis, library)
  3. Hitting /api/health returns 200 JSON and Docker HEALTHCHECK reports the container as healthy
  4. The container runs as non-root user (uid 1001), and SQLite writes to a configurable DATABASE_PATH location
  5. Build context excludes node_modules, .next, and .git (verified by build speed and context size)
**Plans:** 2/2 plans complete

Plans:
- [x] 10-01-PLAN.md — App code changes: standalone config, configurable paths, health endpoint, unit tests
- [x] 10-02-PLAN.md — Docker infrastructure: .dockerignore and multi-stage Dockerfile with smoke verification

### Phase 11: Local Dev Environment
**Goal**: A developer can clone the repo and run the full app with `docker compose up` -- no Node.js installation required
**Depends on**: Phase 10
**Requirements**: DEV-01, DEV-02, DEV-03, DEV-04, DEV-05
**Success Criteria** (what must be TRUE):
  1. Running `docker compose up` starts the app and it is accessible at localhost:3000 with no prior Node.js setup
  2. Editing a source file on the host triggers hot module reload in the browser without container restart
  3. Creating an analysis, stopping the container, and restarting it shows the analysis still in the library (SQLite persists via volume)
  4. Setting API keys in .env file populates the settings UI with those values as defaults on first load
  5. Selecting Ollama as the AI provider from inside the container successfully reaches Ollama running on the host
**Plans:** 2/2 plans complete

Plans:
- [ ] 11-01-PLAN.md — Docker dev infrastructure: Dockerfile.dev, docker-compose.yml, .env.example, .gitignore updates
- [ ] 11-02-PLAN.md — OLLAMA_BASE_URL env var support in settings.ts with TDD tests

### Phase 12: Production Deployment
**Goal**: A self-hosted production deployment with automatic HTTPS via Caddy reverse proxy
**Depends on**: Phase 10
**Requirements**: PROD-01, PROD-02
**Success Criteria** (what must be TRUE):
  1. A provided Caddyfile configures automatic HTTPS and reverse proxies requests to the FilmIntern container
  2. Running an AI analysis through the Caddy proxy delivers streamed SSE responses without buffering or timeouts
**Plans:** 1/1 plans complete

Plans:
- [x] 12-01-PLAN.md — Caddyfile and docker-compose.prod.yml for Unraid production deployment with streaming support

### Phase 13: CI/CD Pipeline
**Goal**: Every push to main automatically builds and publishes a versioned Docker image to GitHub Container Registry
**Depends on**: Phase 10
**Requirements**: CI-01, CI-02, CI-03, CI-04, CI-05
**Success Criteria** (what must be TRUE):
  1. Pushing to main triggers a GitHub Actions workflow that builds and pushes the image to ghcr.io
  2. Subsequent builds complete faster than the first due to BuildKit layer caching
  3. Each published image is tagged with both the git SHA and 'latest' for version tracking and rollback
  4. The image targets linux/amd64 and runs correctly on both Docker Desktop (Windows/Mac) and Unraid
  5. An Unraid deployment guide exists with setup instructions for pulling and running the GHCR image
**Plans:** 2/2 plans complete

Plans:
- [ ] 13-01-PLAN.md — GitHub Actions workflow for Docker build and GHCR push with BuildKit caching
- [ ] 13-02-PLAN.md — Unraid deployment guide with GHCR auth, setup, update, and rollback instructions

## Progress

**Execution Order:**
Phases execute in numeric order: 10 -> 11 -> 12 -> 13
(Phases 12 and 13 both depend only on Phase 10, not on each other.)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Vertical Slice | v1.0 | 3/3 | Complete | 2026-03-17 |
| 2. File Format Support | v1.0 | 2/2 | Complete | 2026-03-17 |
| 3. Analysis Expansion | v1.0 | 3/3 | Complete | 2026-03-17 |
| 3.1. Multi-Provider AI | v1.0 | 3/3 | Complete | 2026-03-17 |
| 4. Export & Doc Gen | v1.0 | 6/6 | Complete | 2026-03-17 |
| 5. UI Theme & Brand | v1.0 | 2/2 | Complete | 2026-03-18 |
| 6. Card-Based Workspaces | v1.0 | 5/5 | Complete | 2026-03-19 |
| 7. Library & Persistence | v1.0 | 2/2 | Complete | 2026-03-19 |
| 8. Provider Error Handling | v1.0 | 1/1 | Complete | 2026-03-19 |
| 9. Harsh Critic Mode | v1.0 | 2/2 | Complete | 2026-03-19 |
| 10. Docker Build | v2.0 | 2/2 | Complete | 2026-03-19 |
| 11. Local Dev Environment | v2.0 | 2/2 | Complete | 2026-03-19 |
| 12. Production Deployment | v2.0 | 1/1 | Complete | 2026-03-19 |
| 13. CI/CD Pipeline | 2/2 | Complete    | 2026-03-20 | - |
