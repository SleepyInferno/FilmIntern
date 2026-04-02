# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# Skip Playwright browser download — we install system Chromium in runner
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential python3 && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ============================================
# Stage 2: Build the application
# ============================================
FROM node:22-bookworm-slim AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build and prune unnecessary files in a single layer
RUN npm run build && \
    # Remove better-sqlite3 prebuilds (compiled .node is in build/Release/)
    find .next/standalone/node_modules/better-sqlite3/prebuilds \
         -mindepth 1 -delete 2>/dev/null || true && \
    rm -rf \
      .next/standalone/node_modules/better-sqlite3/src \
      .next/standalone/node_modules/better-sqlite3/deps \
      .next/standalone/node_modules/better-sqlite3/binding.gyp \
      .next/standalone/node_modules/better-sqlite3/CHANGELOG.md \
      .next/standalone/node_modules/typescript \
      .next/standalone/node_modules/pdfjs-dist/legacy \
      .next/standalone/node_modules/pdfjs-dist/web \
      .next/standalone/node_modules/pdfjs-dist/image_decoders \
      2>/dev/null || true && \
    # Remove non-Linux platform binaries from @napi-rs
    find .next/standalone/node_modules/@napi-rs \
         \( -name "*win32*" -o -name "*darwin*" -o -name "*wasm-runtime*" \) \
         -mindepth 2 | xargs rm -rf 2>/dev/null || true

# ============================================
# Stage 3: Production runtime
# ============================================
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/filmintern.db
ENV SETTINGS_DIR=/app/data/.filmintern
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

# Install Chromium for Playwright PDF export (no curl — health check uses Node)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      chromium \
      libnss3 \
      libatk-bridge2.0-0 \
      libcups2 \
      libxcomposite1 \
      libxdamage1 \
      libxrandr2 \
      libgbm1 \
      libxkbcommon0 \
      libasound2 && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Create data directory owned by nextjs user
RUN mkdir -p /app/data/.filmintern && chown -R nextjs:nodejs /app/data

# Copy standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check using Node.js — no curl dependency needed
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT||3000) + '/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "--max-old-space-size=512", "server.js"]
