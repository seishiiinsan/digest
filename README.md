# Digest

Veille techno open source et auto-hébergeable. Chaque utilisateur choisit ses thèmes, branche sa propre clé Anthropic et reçoit chaque jour ou chaque semaine une synthèse sourcée, rédigée dans sa langue.

> En développement : étape 2 (comptes) du [cahier des charges](docs/cahier-des-charges.md).

## Lancer avec Docker

```bash
git clone https://github.com/seishiiinsan/digest.git
cd digest
docker compose up
```

L'app répond sur http://localhost:3000 et les emails (confirmation d'adresse, mot de passe oublié) arrivent dans Mailpit sur http://localhost:8025.

Les valeurs par défaut suffisent en local. Sur un serveur, copiez `.env.example` en `.env` et changez au moins `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `APP_URL` et `SMTP_URL`.

| Service | Rôle |
| --- | --- |
| `db` | PostgreSQL 17, exposé sur `127.0.0.1` uniquement |
| `mailpit` | Boîte mail de test (SMTP 1025, interface 8025), en local uniquement |
| `migrate` | Applique les migrations Prisma puis s'arrête |
| `web` | Next.js 16 (sortie standalone), santé sur `/api/health` |
| `worker` | Planificateur : tick toutes les minutes (génération des veilles à venir) |

## Développer

Prérequis : Node 24 (voir `.nvmrc`), pnpm 10 (`corepack enable`), Docker.

```bash
cp .env.example .env
pnpm install
docker compose up -d db mailpit
pnpm db:deploy    # applique les migrations en local
pnpm dev          # web sur http://localhost:3000
pnpm dev:worker   # worker en mode watch
```

| Script | Effet |
| --- | --- |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Types des routes Next + `tsc` |
| `pnpm test` | Vitest |
| `pnpm test:e2e` | Playwright sur le build (`pnpm build` avant, db et mailpit lancés) |
| `pnpm build` / `pnpm build:worker` | Build Next.js / bundle du worker (`dist/worker.mjs`) |
| `pnpm db:migrate` | Nouvelle migration à partir de `prisma/schema.prisma` |

## Structure

```
prisma/            schéma et migrations
src/app/           Next.js (pages, routes API)
src/lib/           code partagé web + worker (auth, emails, base)
e2e/               parcours Playwright
src/worker/        planificateur et jobs
scripts/           build du worker
docs/              cahier des charges
```

Le client Prisma est généré dans `src/generated/` à l'installation (non versionné).
