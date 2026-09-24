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

# Migrations appliquées au démarrage par le service `migrate`.
# Image minimale : seulement le CLI Prisma, aux versions du package.json.
FROM node:24-alpine AS migrate
WORKDIR /app
RUN --mount=type=bind,source=package.json,target=/tmp/package.json \
    npm install --no-save --no-audit --no-fund \
      "prisma@$(node -p "require('/tmp/package.json').devDependencies.prisma")" \
      "dotenv@$(node -p "require('/tmp/package.json').devDependencies.dotenv")" \
    && npm cache clean --force
COPY prisma.config.ts ./
COPY prisma ./prisma
USER node
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

FROM deps AS build
COPY . .
RUN pnpm build && pnpm build:worker

# Worker : un seul fichier bundlé, sans node_modules
FROM node:24-alpine AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/dist ./dist
USER node
CMD ["node", "--enable-source-maps", "dist/worker.mjs"]

# Web : sortie standalone de Next.js
FROM node:24-alpine AS web
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
