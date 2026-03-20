# Phase 13: CI/CD Pipeline - Research

**Researched:** 2026-03-19
**Domain:** GitHub Actions, Docker Build/Push, GHCR, Unraid deployment
**Confidence:** HIGH

## Summary

Phase 13 requires a GitHub Actions workflow that builds the existing multi-stage Dockerfile and pushes versioned images to GitHub Container Registry (ghcr.io), plus an Unraid deployment guide. The Docker ecosystem has a well-established set of official GitHub Actions (docker/build-push-action@v7, docker/metadata-action@v6, docker/login-action@v4, docker/setup-buildx-action@v4) that handle the entire build-tag-push pipeline with BuildKit caching. This is a mature, well-documented domain with minimal risk.

The project already has a working Dockerfile, a docker-compose.prod.yml referencing `ghcr.io/sleepyinferno/filmintern:latest`, and no existing `.github/workflows` directory. The repo is at `github.com/SleepyInferno/FilmIntern` (private, authenticated via PAT).

**Primary recommendation:** Use the standard Docker GitHub Actions stack with `type=gha` BuildKit caching and `docker/metadata-action` for SHA + latest tagging. Pair with a markdown-based Unraid deployment guide (not XML template, which requires Community Applications plugin submission).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CI-01 | GitHub Actions workflow builds and pushes image to GHCR on push to main | docker/build-push-action@v7 with docker/login-action@v4 for GHCR auth using GITHUB_TOKEN |
| CI-02 | CI build uses BuildKit layer caching for fast subsequent builds | `cache-from: type=gha` and `cache-to: type=gha,mode=max` with setup-buildx-action |
| CI-03 | Image tagged with git SHA and 'latest' for version tracking and rollback | docker/metadata-action@v6 with `type=sha` and `flavor: latest=auto` |
| CI-04 | Image targets linux/amd64 (Docker Desktop + Unraid compatible) | `platforms: linux/amd64` in build-push-action (no QEMU needed for single-platform) |
| CI-05 | Unraid deployment guide with setup instructions for pulling/running GHCR image | Markdown guide covering GHCR auth, docker-compose.prod.yml usage, volume permissions |
</phase_requirements>

## Standard Stack

### Core (GitHub Actions)

| Action | Version | Purpose | Why Standard |
|--------|---------|---------|--------------|
| docker/build-push-action | v7 | Build and push Docker images | Official Docker action, full BuildKit support |
| docker/metadata-action | v6 | Generate image tags/labels from Git context | Handles SHA tagging, latest logic, OCI labels |
| docker/login-action | v4 | Authenticate to container registries | Supports GHCR via GITHUB_TOKEN (no PAT needed in CI) |
| docker/setup-buildx-action | v4 | Set up Docker Buildx builder | Required for BuildKit cache backends |
| actions/checkout | v4 | Check out repository | Standard, needed for Dockerfile context |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| GITHUB_TOKEN | GHCR authentication | Automatically available in Actions, needs `packages: write` permission |
| GitHub Actions Cache (type=gha) | BuildKit layer cache backend | Every build -- stores/retrieves layer cache via GitHub's cache service |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| type=gha cache | Registry cache (type=registry) | Registry cache stores in GHCR itself; gha is simpler, no extra image, 10GB free |
| docker/metadata-action | Manual tagging | Metadata-action handles edge cases (PR builds, release tags) automatically |
| Unraid XML template | Markdown deployment guide | XML requires CA plugin submission; markdown guide is sufficient for personal use |

## Architecture Patterns

### Recommended Project Structure
```
.github/
  workflows/
    docker-publish.yml    # Single workflow file
docs/
  unraid-deployment.md    # Unraid setup guide
```

### Pattern 1: Single-Platform Build with GHA Cache

**What:** Build linux/amd64 only (matching existing Dockerfile), cache all layers via GitHub Actions cache backend.
**When to use:** Single architecture target, which is this project's case (CI-04 explicitly scopes to amd64 only).

**Complete workflow:**
```yaml
# Source: https://docs.docker.com/build/ci/github-actions/cache/
# Source: https://github.com/docker/build-push-action
name: Build and Publish Docker Image

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v4

      - name: Log in to GHCR
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v6
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          platforms: linux/amd64
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Pattern 2: Tag Format from metadata-action

**What:** `type=sha` produces tags like `sha-90dd603` (7-char short SHA). Combined with `type=raw,value=latest,enable={{is_default_branch}}`, this produces exactly two tags per push to main: `sha-XXXXXXX` and `latest`.
**When to use:** Always -- this is the standard tagging pattern for CI-03.

### Pattern 3: GHCR Package Visibility

**What:** GHCR packages from private repos are private by default. For personal use this is correct. The repo settings control access -- no additional configuration needed beyond the workflow permissions block.
**When to use:** Private repo like FilmIntern.

### Anti-Patterns to Avoid

- **Using docker/setup-qemu-action for single-platform:** QEMU is only needed for cross-platform builds (arm64 on amd64 runner). Skip it entirely for amd64-only builds -- it adds ~15s setup time for no benefit.
- **Using `type=ref,event=branch` for latest tag:** This creates a tag named after the branch (e.g., `main`), not `latest`. Use `type=raw,value=latest` for an explicit `latest` tag.
- **Caching with mode=min (default):** Always use `mode=max` to cache all intermediate layers, not just the final layer. Critical for multi-stage Dockerfiles where deps/builder stages benefit from caching.
- **Creating a PAT for CI GHCR auth:** The built-in GITHUB_TOKEN with `packages: write` permission is sufficient. PATs are only needed for cross-repo or external access (like Unraid pulling from a private repo).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image tagging | Shell script parsing git rev-parse | docker/metadata-action@v6 | Handles SHA length, branch names, PR events, OCI labels |
| GHCR authentication | Manual docker login with secrets | docker/login-action@v4 | Handles token masking, registry URL formatting |
| BuildKit setup | Install buildx manually | docker/setup-buildx-action@v4 | Manages builder lifecycle, driver selection |
| Cache configuration | Manual cache mount/save steps | `cache-from/cache-to: type=gha` | Integrated with GitHub's cache service, automatic cleanup |

**Key insight:** The Docker GitHub Actions ecosystem is designed as a cohesive stack. Each action handles edge cases (token expiry, cache eviction, tag sanitization) that are easy to get wrong in custom scripts.

## Common Pitfalls

### Pitfall 1: Missing permissions block
**What goes wrong:** Workflow fails with "denied: permission_denied: write_package" error.
**Why it happens:** GitHub Actions defaults to read-only permissions. GHCR push requires explicit `packages: write`.
**How to avoid:** Always include the `permissions` block with `contents: read` and `packages: write`.
**Warning signs:** 403 errors on push step.

### Pitfall 2: Cache not working (mode=min default)
**What goes wrong:** Subsequent builds are not faster despite cache configuration.
**Why it happens:** `mode=min` (the default) only caches the final layer. In a multi-stage build, the expensive `deps` and `builder` stages are not cached.
**How to avoid:** Always set `cache-to: type=gha,mode=max`.
**Warning signs:** Build times remain constant across runs; "CACHED" not appearing in build logs for early stages.

### Pitfall 3: Repository name must be lowercase for GHCR
**What goes wrong:** Push fails with invalid reference format.
**Why it happens:** GHCR requires lowercase image names but GitHub repo names can be mixed case (e.g., `SleepyInferno/FilmIntern`).
**How to avoid:** Use `${{ github.repository }}` in metadata-action -- it automatically lowercases. Alternatively, hardcode `ghcr.io/sleepyinferno/filmintern`.
**Warning signs:** "invalid reference format" error in build-push step.

### Pitfall 4: Unraid GHCR auth for private repos
**What goes wrong:** Unraid cannot pull image -- "unauthorized" error.
**Why it happens:** Private GHCR repos require authentication. Unraid does not have built-in GHCR auth.
**How to avoid:** Document `docker login ghcr.io` with a PAT (read:packages scope) in the Unraid deployment guide. The docker-compose.prod.yml comments already mention this.
**Warning signs:** Pull fails on Unraid but works locally where user is already logged in.

### Pitfall 5: GitHub Actions Cache size limit
**What goes wrong:** Old caches are evicted, builds slow down intermittently.
**Why it happens:** GitHub Actions cache has a 10GB per-repo limit. Docker layer caches for 440MB images can consume significant space.
**How to avoid:** This is generally fine for a single workflow. Monitor via Actions -> Caches in repo settings if builds become inconsistent.
**Warning signs:** Sporadic slow builds after fast ones.

## Code Examples

### Complete Workflow File
```yaml
# Source: Docker official docs + docker/build-push-action README
# .github/workflows/docker-publish.yml
name: Build and Publish Docker Image

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v6
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          platforms: linux/amd64
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Unraid Deployment Guide Structure
```markdown
# Deploying FilmIntern on Unraid

## Prerequisites
- Unraid 6.12+ with Docker enabled
- GitHub Personal Access Token with `read:packages` scope

## Step 1: Authenticate to GHCR
(docker login command)

## Step 2: Create data directory
(mkdir + chown for uid 1001)

## Step 3: Deploy with Docker Compose
(copy docker-compose.prod.yml + Caddyfile)

## Step 4: Verify
(curl health endpoint)

## Updating
(docker compose pull && docker compose up -d)

## Rollback
(reference SHA-tagged image)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| docker/build-push-action@v5 | docker/build-push-action@v7 | 2025 | Better provenance, attestation support |
| docker/metadata-action@v5 | docker/metadata-action@v6 | 2025 | Improved tag generation |
| Legacy GitHub Cache API | New GitHub Cache service | April 2025 | Old API deprecated, type=gha uses new service automatically |
| Manual `docker buildx create` | docker/setup-buildx-action@v4 | 2024 | Automatic builder lifecycle management |

**Deprecated/outdated:**
- docker/build-push-action@v5 and earlier: Still works but v7 is current
- `type=registry` inline cache: Works but `type=gha` is simpler for GitHub Actions
- Legacy GitHub Cache API: Shut down April 2025, all current action versions use the new service

## Open Questions

1. **Repository visibility on GHCR**
   - What we know: Private repos create private packages by default. The docker-compose.prod.yml already documents PAT-based auth for Unraid.
   - What's unclear: Whether the user wants to make the package public (no auth needed on Unraid) or keep it private.
   - Recommendation: Default to private (matches repo), document both options in the deployment guide.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via package.json) |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CI-01 | Workflow triggers on push to main, builds and pushes | manual-only | Push to main and verify in Actions tab | N/A -- workflow YAML validation only |
| CI-02 | BuildKit caching speeds up subsequent builds | manual-only | Compare build times in Actions logs | N/A -- observable in CI logs |
| CI-03 | Image tagged with SHA and latest | manual-only | `gh api /user/packages/container/filmintern/versions` | N/A -- verify via GHCR API |
| CI-04 | Image targets linux/amd64 | manual-only | `docker manifest inspect ghcr.io/sleepyinferno/filmintern:latest` | N/A -- verify after first push |
| CI-05 | Unraid deployment guide exists | manual-only | File existence check | N/A -- documentation deliverable |

### Sampling Rate
- **Per task commit:** YAML lint validation (optional, actionlint tool)
- **Per wave merge:** Push to main triggers actual workflow execution
- **Phase gate:** Verify image exists on GHCR with correct tags after first push

### Wave 0 Gaps
None -- this phase creates infrastructure files (workflow YAML, deployment guide) that are validated by execution, not unit tests. No test framework changes needed.

## Sources

### Primary (HIGH confidence)
- [Docker build-push-action](https://github.com/docker/build-push-action) - v7 workflow patterns, GHCR examples
- [Docker metadata-action](https://github.com/docker/metadata-action) - v6 tag type configuration (sha, raw, flavor)
- [Docker cache management with GitHub Actions](https://docs.docker.com/build/ci/github-actions/cache/) - type=gha cache configuration, mode=max
- [Docker GitHub Actions cache backend](https://docs.docker.com/build/cache/backends/gha/) - GHA cache service details

### Secondary (MEDIUM confidence)
- [Selfhosters.net Unraid templating](https://selfhosters.net/docker/templating/templating/) - Unraid XML template structure
- [Unraid Community Applications docs](https://docs.unraid.net/unraid-os/using-unraid-to/run-docker-containers/community-applications/) - CA plugin usage

### Tertiary (LOW confidence)
- None -- all findings verified against official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Docker actions, well-documented, widely used
- Architecture: HIGH - Single workflow file, standard pattern used across thousands of repos
- Pitfalls: HIGH - Known issues documented in official repos and Docker docs
- Unraid guide: MEDIUM - Based on existing docker-compose.prod.yml patterns and community docs

**Research date:** 2026-03-19
**Valid until:** 2026-06-19 (stable domain, actions use major version tags)
