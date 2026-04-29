# apps\api\Dockerfile

# -------------------------------------------------------------------
# Image Docker multi-étapes pour @kraak/api (NestJS)
# Contexte de build : racine du dépôt (docker build -f apps/api/Dockerfile .)
# -------------------------------------------------------------------

# --- Base commune : Node 24 Alpine + pnpm ---
FROM node:24-alpine AS base
RUN apk update && apk upgrade --no-cache && \
    corepack enable && corepack prepare pnpm@10.23.0 --activate
WORKDIR /app

# --- Étape 1 : installation des dépendances ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/client/package.json apps/client/
COPY packages/api-client/package.json packages/api-client/
COPY packages/contracts/package.json packages/contracts/
COPY packages/domain/package.json packages/domain/
COPY packages/tokens/package.json packages/tokens/
RUN pnpm install --frozen-lockfile --ignore-scripts

# --- Étape 2 : build TypeScript ---
FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/contracts/ packages/contracts/
COPY packages/domain/ packages/domain/
RUN pnpm --filter @kraak/api build
RUN pnpm deploy --filter @kraak/api --prod --legacy /prod/api

# --- Étape 3 : image de production ---
FROM node:24-alpine AS production

RUN apk update && apk upgrade --no-cache && \
    addgroup -g 1001 -S nestjs && adduser -S nestjs -u 1001

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /prod/api/node_modules ./node_modules
COPY --from=build /prod/api/package.json ./
COPY --from=build /app/apps/api/dist ./dist

USER nestjs
EXPOSE 3000

CMD ["node", "dist/main.js"]
