# 1. Base stage for building
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy root workspace configurations
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Copy individual package manifests and source configurations required for workspace linking
COPY packages/database/package.json ./packages/database/
COPY packages/services/package.json ./packages/services/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/logger/package.json ./packages/logger/
COPY packages/typescript-config ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (now correctly links local workspace packages)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build required packages and the api app
RUN pnpm --filter @repo/database build
RUN pnpm --filter @repo/logger build
RUN pnpm --filter @repo/api build

# 2. Production runtime stage
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production

# Copy workspace configuration and built applications/packages
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