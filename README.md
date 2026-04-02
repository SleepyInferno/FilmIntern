# FilmIntern

A self-hosted AI analysis tool for film and media production. Upload a script, treatment, or scene breakdown — pick your project type — and get a structured, streaming analysis back. One tool that replaces hours of manual review across scattered apps.

Built with Next.js, SQLite, and the Vercel AI SDK. Runs locally via Docker or deploys to Unraid with a single Compose file.

---

## Features

- **Four project types** — Documentary, Narrative, Corporate, TV Episodic; each with its own analysis schema and structured output
- **Harsh Critic mode** — An adversarial second-pass analysis that pressure-tests weak points in your material
- **Multi-provider AI** — Switch between Anthropic Claude, OpenAI GPT, and local Ollama models from the Settings panel; no restart required
- **Card-based workspaces** — Analysis results surface as navigable cards; export individual cards or full reports
- **Script Improvement** — AI-generated rewrite suggestions with accept/reject workflow and live script preview
- **Export** — PDF (via Playwright Chromium) and DOCX export for analysis reports and generated documents (shot lists, image prompts)
- **Project library** — All analyses persist to a local SQLite database; browse, revisit, and compare past work
- **Streaming responses** — Results appear progressively as the model generates them; no waiting for the full response
- **Security headers** — X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **Fully self-hosted** — No telemetry, no cloud dependency beyond your chosen AI provider's API

---

## Quick Start (Docker Dev)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine (Linux).

```bash
git clone https://github.com/SleepyInferno/FilmIntern.git
cd FilmIntern
cp .env.example .env          # add your API key(s) — see Configuration below
docker compose up
```

Open [http://localhost:3000](http://localhost:3000).

Hot module reload is enabled — edit any file in `src/` and the browser updates instantly without restarting the container.

Data (SQLite database and settings) persists to `./data/` on the host, surviving container restarts.

---

## Configuration

### API Keys

Copy `.env.example` to `.env` and fill in the key(s) for your chosen provider:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

Keys set in `.env` populate the Settings UI as defaults. You can also enter or change them directly in the app without touching the file.

### AI Provider

Select your provider and model in **Settings** (gear icon, top-right). Available options:

| Provider | Default Model | Requires |
|----------|--------------|---------|
| Anthropic | claude-sonnet-4-6 | `ANTHROPIC_API_KEY` |
| OpenAI | gpt-5.4 | `OPENAI_API_KEY` |
| Ollama | llama3.1 | Ollama running locally |

Switch provider at any time — the selection persists to `./data/.filmintern/settings.json`.

### Ollama (Local Models)

Start Ollama on your host machine, then set `OLLAMA_BASE_URL` in your `.env`:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434/api
```

The dev Compose file sets this automatically. For bare-metal (no Docker), point it at `http://localhost:11434/api`.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Anthropic API key (used as fallback if not set in Settings UI) |
| `OPENAI_API_KEY` | — | OpenAI API key (used as fallback if not set in Settings UI) |
| `OLLAMA_BASE_URL` | `http://localhost:11434/api` | Ollama server URL |
| `DATABASE_PATH` | `./dev.db` (bare) / `/app/data/filmintern.db` (Docker) | SQLite database file path |
| `SETTINGS_DIR` | `./.filmintern` (bare) / `/app/data/.filmintern` (Docker) | Directory for persisted settings JSON |
| `PORT` | `3000` | HTTP port the app listens on |

---

## Production Deployment (Unraid)

See [docs/unraid-deployment.md](docs/unraid-deployment.md) for the full step-by-step guide.

**Short version:**

1. Create the data directory and set ownership:
   ```bash
   mkdir -p /mnt/user/appdata/filmintern
   chown -R 1001:1001 /mnt/user/appdata/filmintern
   ```

2. (Optional) Create an `.env` file for API keys:
   ```bash
   cat > /mnt/user/appdata/filmintern/.env << 'EOF'
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   EOF
   chmod 600 /mnt/user/appdata/filmintern/.env
   ```

3. Place `docker-compose.prod.yml` and `Caddyfile` in a working directory on Unraid.

4. Log in to GHCR and start the stack:
   ```bash
   docker login ghcr.io -u YOUR_GITHUB_USERNAME
   docker compose -f docker-compose.prod.yml up -d
   ```

5. Verify health:
   ```bash
   curl http://localhost:7430/api/health
   # {"status":"ok","version":"0.1.0","db":"connected"}
   ```

The app is accessible at `http://YOUR_UNRAID_IP:7430`.

**Architecture:** Caddy (port 7430) → reverse proxy → FilmIntern app (port 3000, internal). The app container is not exposed directly. Caddy is configured with `flush_interval -1` and a 6-minute `response_header_timeout` to support long-running AI generation endpoints without buffering or premature timeouts.

**HTTPS:** The Caddyfile currently uses HTTP on port 7430 for LAN access. To enable automatic HTTPS later, replace `:7430` in the Caddyfile with your domain name — Caddy handles certificate provisioning automatically.

**SQLite on Unraid:** If your Unraid pool uses NFS-backed paths, point the volume directly to a disk path (e.g., `/mnt/disk1/appdata/filmintern`) rather than `/mnt/user/` for reliable SQLite WAL locking.

---

## CI/CD

Every push to `main` triggers a GitHub Actions workflow that:

1. Builds the Docker image using BuildKit with GHA layer caching
2. Tags it with the git SHA (`sha-XXXXXXX`) and `latest`
3. Pushes to `ghcr.io/sleepyinferno/filmintern`

The production Compose file references `:latest` for normal deployments. Use a specific SHA tag for pinned or rollback deployments.

---

## Development (Bare Metal)

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database is created at `./dev.db`. Settings persist to `./.filmintern/settings.json`. Both are gitignored.

### Tests

```bash
npm run test          # watch mode
npx vitest run        # single pass
```

---

## Health Check

`GET /api/health` — returns `200` when the database is reachable, `503` otherwise.

```json
{"status":"ok","version":"0.1.0","db":"connected"}
```

The Docker image includes a `HEALTHCHECK` directive that polls this endpoint every 30 seconds (60-second start period, 5 retries). The health check uses a Node.js one-liner instead of curl to minimize image size. The Caddy service in `docker-compose.prod.yml` waits for the app to report healthy before accepting traffic.

---

## Project Structure

```
src/
  app/
    api/
      analyze/          # Main analysis endpoint (streaming SSE)
        critic/         # Harsh Critic mode endpoint
      export/           # PDF and DOCX export
      documents/        # Shot list and image prompt generation
      projects/         # Project CRUD
      settings/         # Provider settings persistence
      health/           # Health check endpoint
  lib/
    ai/
      settings.ts       # Provider settings load/save (cached with 5s TTL)
      provider-registry.ts  # Vercel AI SDK registry builder (cached per config)
      schemas/          # Zod schemas per project type
      prompts/          # System prompts per project type
    db.ts               # SQLite database client (WAL mode, indexed, foreign keys)
    suggestions.ts      # Rewrite suggestion extraction logic
    script-preview-utils.ts  # Script rewrite preview (array-join)
    version.ts          # App version constant

Dockerfile              # Production 3-stage build (node:22-bookworm-slim + Chromium)
Dockerfile.dev          # Dev image (adds build-essential, runs as node user)
docker-compose.yml      # Dev stack (bind-mount, HMR, data persistence)
docker-compose.prod.yml # Production stack (Caddy + app, health-gated, init, env_file)
Caddyfile               # Caddy reverse proxy config (port 7430, 6-min timeout)
docs/
  unraid-deployment.md  # Full Unraid setup guide
.github/
  workflows/
    docker-publish.yml  # CI: build + push to GHCR on push to main
```

---

## License

MIT
