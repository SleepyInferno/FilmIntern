# Deploying FilmIntern on Unraid

A step-by-step guide to deploying FilmIntern on Unraid using Docker Compose with the pre-built image from GitHub Container Registry (GHCR).

## Prerequisites

- Unraid 6.12+ with Docker enabled
- GitHub account with access to the [SleepyInferno/FilmIntern](https://github.com/SleepyInferno/FilmIntern) repository
- GitHub Personal Access Token (PAT) with `read:packages` scope
  - Create one at: **Settings > Developer settings > Personal access tokens > Tokens (classic)**
  - Only the `read:packages` scope is needed

## Step 1: Authenticate to GHCR

Log in to GitHub Container Registry so Docker can pull the private image:

```bash
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Replace `YOUR_GITHUB_PAT` with your Personal Access Token and `YOUR_GITHUB_USERNAME` with your GitHub username.

This stores credentials in `/root/.docker/config.json` on Unraid. You only need to do this once -- credentials persist across reboots.

## Step 2: Create Data Directory

Create the directory where FilmIntern stores its SQLite database and settings:

```bash
mkdir -p /mnt/user/appdata/filmintern
chown -R 1001:1001 /mnt/user/appdata/filmintern
```

The container runs as uid 1001 (non-root). The `chown` ensures the container user can read and write to this directory.

## Step 3: Create Deployment Files

Create a config directory to hold the deployment files:

```bash
mkdir -p /mnt/user/appdata/filmintern-config
```

Place the following two files in `/mnt/user/appdata/filmintern-config/`. These files are also available in the [GitHub repository](https://github.com/SleepyInferno/FilmIntern) at the project root.

### docker-compose.prod.yml

```yaml
# Production deployment for Unraid Docker Compose Manager
# Prerequisites:
#   1. Authenticate to GHCR (private repo):
#      echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u sleepyinferno --password-stdin
#      (PAT needs read:packages scope)
#   2. Create and own the data directory:
#      mkdir -p /mnt/user/appdata/filmintern && chown -R 1001:1001 /mnt/user/appdata/filmintern

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

### Caddyfile

```
# Production reverse proxy for FilmIntern
# Listens on port 7430 (HTTP only, LAN access)
# To enable HTTPS later: replace ":7430" with your domain name

:7430 {
	reverse_proxy app:3000 {
		flush_interval -1
	}
}
```

## Step 4: Deploy

Start FilmIntern from the config directory:

```bash
cd /mnt/user/appdata/filmintern-config
docker compose -f docker-compose.prod.yml up -d
```

The first run pulls the image from GHCR (~440MB) and starts both the app and the Caddy reverse proxy.

## Step 5: Verify

Check that the containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Check the health endpoint (wait approximately 40 seconds for startup):

```bash
curl http://localhost:7430/api/health
```

Expected output:

```json
{"status":"ok","version":"...","database":"connected"}
```

Access the UI in your browser at `http://YOUR_UNRAID_IP:7430`.

## Updating to Latest Version

Pull the latest image and recreate the container:

```bash
cd /mnt/user/appdata/filmintern-config
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

`pull` fetches the latest image from GHCR. `up -d` recreates the container with the new image. Your data persists in the volume mount at `/mnt/user/appdata/filmintern`.

## Rolling Back to a Previous Version

Each CI build produces a SHA-tagged image. To roll back to a specific version:

1. Find the version you want:
   - Visit: https://github.com/SleepyInferno/FilmIntern/pkgs/container/filmintern/versions
   - Or pull directly: `docker pull ghcr.io/sleepyinferno/filmintern:sha-XXXXXXX`

2. Edit `docker-compose.prod.yml` to pin a specific SHA tag:

   ```yaml
   # Change this line:
   image: ghcr.io/sleepyinferno/filmintern:latest
   # To a specific SHA:
   image: ghcr.io/sleepyinferno/filmintern:sha-90dd603
   ```

3. Redeploy:

   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

To resume tracking the latest build, change the image tag back to `:latest` and run `docker compose pull && docker compose up -d`.

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `unauthorized` on pull | GHCR auth expired or missing | Re-run `docker login ghcr.io` with a fresh PAT |
| `permission denied` on data dir | Wrong ownership | `chown -R 1001:1001 /mnt/user/appdata/filmintern` |
| Health check fails | App still starting | Wait 40s after container start, check logs with `docker compose logs app` |
| Ollama not reachable | Missing host networking | Verify `extra_hosts` in compose file includes `host.docker.internal:host-gateway` |
| Port 7430 in use | Another service on that port | Change the port mapping in `docker-compose.prod.yml` under `caddy.ports` and in the `Caddyfile` |

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `DATABASE_PATH` | `/app/data/filmintern.db` | SQLite database file location |
| `SETTINGS_DIR` | `/app/data/.filmintern` | Application settings directory |

AI provider API keys (OpenAI, Anthropic, etc.) can be configured through the Settings UI after first launch. No environment variables needed for API keys.
