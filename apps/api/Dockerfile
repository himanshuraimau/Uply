# Dockerfile for apps/api

# 1. Builder stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy all files from the root of the monorepo
COPY ../../. .

# Install all dependencies
RUN bun install --frozen-lockfile

# Build the specific application (api)
RUN bun run build --filter=api

# 2. Production stage
FROM node:20-slim

WORKDIR /app

# Copy the built application code from the 'builder' stage
COPY --from=builder /app/apps/api/dist ./dist

# Copy the package.json for the 'api' app
COPY --from=builder /app/apps/api/package.json .

# Copy workspace dependencies from the builder stage
COPY --from=builder /app/packages/ ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/bun.lockb .

# Install production dependencies
RUN bun install --production

# Expose the port the app runs on
EXPOSE 3001

# The command to run the application
CMD ["node", "dist/index.js"]
