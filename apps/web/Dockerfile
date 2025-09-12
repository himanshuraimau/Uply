# Dockerfile for apps/web

# 1. Builder stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package manager files
COPY ../../package.json ../../bun.lockb ./

# Copy turbo.json
COPY ../../turbo.json ./

# Copy all workspaces
COPY ../../packages ./packages
COPY ../../apps ./apps

# Install dependencies
RUN bun install --frozen-lockfile

# Build the web application
RUN bun run build --filter=web

# 2. Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy required files from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/next.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["next", "start"]
