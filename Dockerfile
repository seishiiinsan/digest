# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# Dépendances + client Prisma (postinstall)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build && pnpm build:worker

# Image unique publiée (ghcr.io/seishiiinsan/digest) : web, worker et migrations.
#   web     : node server.js (commande par défaut)
#   worker  : node --enable-source-maps worker/worker.mjs
#   migrate : cd migrate && node_modules/.bin/prisma migrate deploy
FROM node:24-alpine AS app
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# CLI Prisma seul, aux versions du package.json, isolé dans /app/migrate.
RUN --mount=type=bind,source=package.json,target=/tmp/package.json \
    mkdir migrate && cd migrate \
    && npm install --no-save --no-audit --no-fund \
      "prisma@$(node -p "require('/tmp/package.json').devDependencies.prisma")" \
      "dotenv@$(node -p "require('/tmp/package.json').devDependencies.dotenv")" \
    && npm cache clean --force
COPY prisma.config.ts ./migrate/
COPY prisma ./migrate/prisma

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/dist ./worker

USER node
EXPOSE 3000
CMD ["node", "server.js"]
