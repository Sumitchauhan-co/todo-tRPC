FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml .npmrc .pnpmfile.cjs ./

COPY packages/database/package.json ./packages/database/
COPY packages/services/package.json ./packages/services/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/logger/package.json ./packages/logger/
COPY packages/typescript-config ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @repo/database build
RUN pnpm --filter @repo/logger build
RUN pnpm --filter @repo/api build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/pnpm-lock.yaml /app/package.json /app/pnpm-workspace.yaml /app/.npmrc /app/.pnpmfile.cjs ./
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/services ./packages/services
COPY --from=builder /app/packages/trpc ./packages/trpc
COPY --from=builder /app/packages/logger ./packages/logger
COPY --from=builder /app/apps/api ./apps/api

RUN pnpm install --prod --frozen-lockfile

EXPOSE 8000

CMD ["pnpm", "--dir", "apps/api", "start"]
