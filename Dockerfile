# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# Install build tools for native addons (better-sqlite3)
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential python3 && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install ALL dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ============================================
# Stage 2: Build the application
# ============================================
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN npm run build

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

# Create non-root user (DOCK-06)
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

# Health check (DOCK-05)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl --fail http://localhost:${PORT:-3000}/api/health || exit 1

CMD ["node", "server.js"]
