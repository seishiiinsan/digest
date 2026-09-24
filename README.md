# Digest

Veille techno open source et auto-hébergeable. Chaque utilisateur choisit ses thèmes, branche sa propre clé Anthropic et reçoit chaque jour ou chaque semaine une synthèse sourcée, rédigée dans sa langue.

> En développement : étape 5 (lecture et livraison) du [cahier des charges](docs/cahier-des-charges.md).

## Lancer avec Docker

```bash
git clone https://github.com/seishiiinsan/digest.git
cd digest
docker compose up
```

L'app répond sur http://localhost:3000 et les emails (confirmation d'adresse, mot de passe oublié) arrivent dans Mailpit sur http://localhost:8025.

Les valeurs par défaut suffisent en local. Sur un serveur, copiez `.env.example` en `.env` et changez au moins `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET` et `ENCRYPTION_KEY` (chacun : `openssl rand -base64 32`), `APP_URL` et `SMTP_URL`.

Les clés API et webhooks sont chiffrés en AES-256-GCM avec `ENCRYPTION_KEY`. Pour la changer sans perdre les secrets : `OLD_ENCRYPTION_KEY=<ancienne> ENCRYPTION_KEY=<nouvelle> pnpm rotate-key`, puis redémarrer `web` et `worker`.

| Service | Rôle |
| --- | --- |
| `db` | PostgreSQL 17, exposé sur `127.0.0.1` uniquement |
| `mailpit` | Boîte mail de test (SMTP 1025, interface 8025), en local uniquement |
| `migrate` | Applique les migrations Prisma puis s'arrête |
| `web` | Next.js 16 (sortie standalone), santé sur `/api/health` |
| `worker` | Planificateur (tick chaque minute) et files pg-boss : génération avec Claude, envoi au webhook |

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
| `pnpm test:integration` | Vitest contre la base (isolation des comptes, chiffrement) |
| `pnpm test:e2e` | Playwright sur le build (`pnpm build` avant, db et mailpit lancés) |
| `pnpm build` / `pnpm build:worker` | Build Next.js / bundle du worker (`dist/worker.mjs`) |
| `pnpm db:migrate` | Nouvelle migration à partir de `prisma/schema.prisma` |

## Pipeline

Le web n'appelle jamais Claude : « Générer maintenant » ou le planificateur crée un `Run` et un job pg-boss, que le worker exécute.

Pour chaque thème actif :

1. **Recherche** : Claude avec `web_search` et `web_fetch` (5 utilisations max chacun, domaines exclus bloqués), reprise automatique sur `pause_turn`.
2. **Mise en forme** : second appel sans outils, sortie JSON validée par un schéma, dans la langue de l'utilisateur.
3. **Garde-fous** : seules les URL citées ou lues à l'étape 1 sont acceptées, doublons des 30 derniers jours rejetés (`urlHash`), tri par pertinence, 10 infos max.

Les notes « utile / pas utile » des 90 derniers jours sont transmises à la recherche suivante du même thème.

Une fois la veille enregistrée, un job de livraison l'envoie au webhook Discord (embeds) ou Slack (blocs) du compte. L'envoi a ses propres reprises : un webhook en panne ne fait pas échouer la veille, l'erreur est affichée sur la veille.

Tokens, recherches et coût estimé sont enregistrés thème par thème sur le `Run`. Une erreur temporaire (limite de débit, API indisponible) est réessayée deux fois avec un délai croissant ; une clé invalide ou un crédit épuisé échoue tout de suite avec un message lisible.

## Structure

```
prisma/            schéma et migrations
src/app/           Next.js (pages, routes API)
src/lib/           code partagé web + worker (auth, emails, base)
e2e/               parcours Playwright
src/pipeline/      recherche, mise en forme, dédoublonnage, coûts
src/worker/        planificateur et file pg-boss
scripts/           build du worker
docs/              cahier des charges
```

Le client Prisma est généré dans `src/generated/` à l'installation (non versionné).
