# apps/api/Dockerfile
# -------------------------------------------------------------------
# Image Docker multi-étapes pour @kraak/api (NestJS)
# Contexte de build : racine du dépôt
#   docker build -f apps/api/Dockerfile -t kraak-api .
# -------------------------------------------------------------------

# --- Base commune : Node 24 Alpine + pnpm ---
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    CI=true
RUN apk update && apk upgrade --no-cache && \
    corepack enable && corepack prepare pnpm@10.23.0 --activate
WORKDIR /app

# --- Étape 1 : installation des dépendances (avec cache pnpm) ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/client/package.json apps/client/
COPY packages/api-client/package.json packages/api-client/
COPY packages/contracts/package.json packages/contracts/
COPY packages/domain/package.json packages/domain/
COPY packages/tokens/package.json packages/tokens/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# --- Étape 2 : build TypeScript + extraction du runtime de prod ---
FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/contracts/ packages/contracts/
COPY packages/domain/ packages/domain/
RUN pnpm --filter @kraak/contracts --filter @kraak/domain build && \
    pnpm --filter @kraak/api build && \
    pnpm deploy --filter @kraak/api --prod --legacy /prod/api

# --- Étape 3 : image de production minimaliste ---
FROM node:24-alpine AS production

LABEL org.opencontainers.image.title="kraak-api" \
      org.opencontainers.image.description="API NestJS du projet KRAAK" \
      org.opencontainers.image.source="https://github.com/Ange230700/kraak-group"

# Patches de sécurité + tini pour la gestion des signaux (PID 1)
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache tini wget && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    NODE_OPTIONS="--enable-source-maps"

# Copies avec ownership correct dès la création
COPY --from=build --chown=nestjs:nodejs /prod/api/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /prod/api/package.json ./package.json
COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./dist

USER nestjs
EXPOSE 3000

# Sonde santé : utilise l'endpoint /health du module Health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --spider --tries=1 "http://127.0.0.1:${PORT}/health" || exit 1

# tini = init léger pour propager SIGTERM/SIGINT proprement
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
