# syntax=docker/dockerfile:1
# Build context: repository root (npm workspaces). `docker compose build api`

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
# tsup bundles the API with the shared package inlined.
RUN npm run build --workspace @admissions-hub/api

FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace @admissions-hub/api --include-workspace-root=false

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
# migrate.js reads its SQL files next to itself.
COPY apps/api/src/db/migrations ./apps/api/dist/db/migrations
COPY apps/api/docker-entrypoint.sh ./apps/api/
WORKDIR /app/apps/api
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/api/health" >/dev/null || exit 1
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
