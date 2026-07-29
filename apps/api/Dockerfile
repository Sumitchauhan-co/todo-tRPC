# 1. Base stage for building
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/services/package.json ./packages/services/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/logger/package.json ./packages/logger/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/ ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# Copy the rest of the workspace source code (host node_modules excluded via .dockerignore)
COPY . .

# Install dependencies with Linux-native workspace symlinks
RUN pnpm install --frozen-lockfile

# Build the api app
RUN pnpm --filter @repo/api build

# 2. Production runtime stage
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production

# Copy workspace configuration and package manifests
COPY --from=builder /app/pnpm-lock.yaml /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/services ./packages/services
COPY --from=builder /app/packages/trpc ./packages/trpc
COPY --from=builder /app/packages/logger ./packages/logger
COPY --from=builder /app/apps/api ./apps/api

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

EXPOSE 8000

# Set working directory to the API application and run the compiled server
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
