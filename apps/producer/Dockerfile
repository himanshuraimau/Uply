# Dockerfile for apps/producer

# Use a base image with bun
FROM oven/bun:1

WORKDIR /app

# Copy all files from the root of the monorepo
COPY ../../. .

# Install all dependencies
RUN bun install --frozen-lockfile

# The command to run the application
CMD ["bun", "run", "apps/producer/index.ts"]
