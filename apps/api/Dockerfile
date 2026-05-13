# apps/api/Dockerfile
# -------------------------------------------------------------------
# Image Docker multi-étapes pour @kraak/api (NestJS)
# Contexte de build : racine du dépôt
#   docker build -f apps/api/Dockerfile -t kraak-api .
# -------------------------------------------------------------------

# --- Base commune : Node 22 Debian slim + pnpm ---
ARG NODE_IMAGE=node:22-bookworm-slim
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME="/pnpm" \
  PATH="/pnpm:$PATH" \
  CI=true
RUN apt-get update && apt-get upgrade -y && \
  rm -rf /var/lib/apt/lists/* && \
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
COPY --chmod=0444 tsconfig.base.json ./
COPY --chmod=0555 apps/api/ apps/api/
COPY --chmod=0555 packages/contracts/ packages/contracts/
COPY --chmod=0555 packages/domain/ packages/domain/
RUN pnpm --filter @kraak/api... build && \
  pnpm deploy --filter @kraak/api --prod --legacy /prod/api

# --- Étape 3 : image de production minimaliste ---
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS production

LABEL org.opencontainers.image.title="kraak-api" \
  org.opencontainers.image.description="API NestJS du projet KRAAK" \
  org.opencontainers.image.source="https://github.com/Ange230700/kraak-group"

WORKDIR /app
ENV NODE_ENV=production \
  PORT=3000 \
  HOST=0.0.0.0 \
  NODE_OPTIONS="--enable-source-maps"

# Copies immuables: propriétaire root + permissions non-écriture
COPY --from=build --chown=root:root --chmod=0555 /prod/api/node_modules ./node_modules
COPY --from=build --chown=root:root --chmod=0444 /prod/api/package.json ./package.json
COPY --from=build --chown=root:root --chmod=0555 /app/apps/api/dist ./dist

USER nonroot
EXPOSE 3000

CMD ["dist/main.js"]
