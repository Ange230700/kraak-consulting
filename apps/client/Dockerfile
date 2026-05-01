# apps/client/Dockerfile
# -------------------------------------------------------------------
# Image Docker multi-étapes pour @kraak/client (Angular Universal / SSR)
# Contexte de build : racine du dépôt
#   docker build -f apps/client/Dockerfile -t kraak-web .
#
# Note : Vercel n'utilise PAS ce Dockerfile (il s'appuie sur vercel.json).
# Cette image sert pour les builds CI conteneurisés et l'auto-hébergement
# du serveur SSR (`serve:ssr:web`).
# -------------------------------------------------------------------

# --- Base commune : Node 24 Alpine + pnpm ---
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    CI=true
RUN apk update && apk upgrade --no-cache && \
    corepack enable && corepack prepare pnpm@10.23.0 --activate
WORKDIR /app

# --- Étape 1 : installation des dépendances ---
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

# --- Étape 2 : build Angular (SSR + browser) ---
FROM deps AS build
ARG BUILD_ENV=production
ENV NODE_ENV=production
COPY tsconfig.base.json ./
COPY scripts/ scripts/
COPY apps/client/ apps/client/
COPY packages/api-client/ packages/api-client/
COPY packages/contracts/ packages/contracts/
COPY packages/domain/ packages/domain/
COPY packages/tokens/ packages/tokens/
RUN pnpm --filter @kraak/client build:web && \
    pnpm deploy --filter @kraak/client --prod --legacy /prod/web

# --- Étape 3 : image de production (serveur SSR) ---
FROM node:24-alpine AS production

LABEL org.opencontainers.image.title="kraak-web" \
      org.opencontainers.image.description="Site KRAAK (Angular SSR)" \
      org.opencontainers.image.source="https://github.com/Ange230700/kraak-group"

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache tini wget && \
    addgroup -g 1001 -S nodejs && \
    adduser -S angular -u 1001 -G nodejs

WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000 \
    HOST=0.0.0.0

# Runtime SSR (express) + sortie Angular
COPY --from=build --chown=angular:nodejs --chmod=0555 /prod/web/node_modules ./node_modules
COPY --from=build --chown=angular:nodejs --chmod=0444 /prod/web/package.json ./package.json
COPY --from=build --chown=angular:nodejs --chmod=0555 /app/apps/client/dist ./dist

USER angular
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --spider --tries=1 "http://127.0.0.1:${PORT}/" || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/web/server/server.mjs"]
