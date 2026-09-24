# Digest

Veille techno open source et auto-hébergeable. Chaque utilisateur choisit ses thèmes, branche sa propre clé Anthropic et reçoit chaque jour ou chaque semaine une synthèse sourcée, rédigée dans sa langue, dans l'app et sur Discord ou Slack.

Démo : [digest.gabin-hallosserie.com](https://digest.gabin-hallosserie.com) (inscription libre, avec votre propre clé Anthropic).

![Fil de lecture](docs/captures/fil.png)

## Fonctionnalités

- **Thèmes** en langage naturel, avec mots-clés, sources à privilégier ou exclure, niveau de détail, et modèles prêts (IA, front-end, sécurité, DevOps).
- **Veilles sourcées** : chaque info a un résumé, un « pourquoi c'est important » et au moins une source réelle, avec l'extrait cité. Aucun lien inventé, pas de doublon d'une veille à l'autre.
- **Planning** quotidien ou hebdomadaire à l'heure locale, ou « Générer maintenant ».
- **Lecture** : fil, favoris, recherche plein texte, notes utile / pas utile qui affinent les veilles suivantes.
- **Livraison** dans l'app et par webhook Discord ou Slack.
- **Suivi** : historique des exécutions, erreurs lisibles, tokens et coût de chaque veille.
- **Votre clé, votre coût** : la clé Anthropic de chaque compte est testée, chiffrée (AES-256-GCM) et jamais renvoyée au navigateur.

| Rubriques | Réglages |
| --- | --- |
| ![Rubriques](docs/captures/themes.png) | ![Réglages](docs/captures/reglages.png) |

## Architecture

```mermaid
flowchart LR
  U[Navigateur] --> C[Caddy<br/>HTTPS]
  C --> W[web<br/>Next.js 16]
  W --> DB[(Postgres 17)]
  S[worker<br/>planificateur + pg-boss] --> DB
  S --> A[API Claude<br/>web search + fetch]
  S --> H[Webhook<br/>Discord / Slack]
```

Le web n'appelle jamais Claude : « Générer maintenant » ou le planificateur crée un `Run` et un job pg-boss, que le worker exécute. Pour chaque thème actif :

1. **Recherche** : Claude avec `web_search` et `web_fetch` (5 utilisations max chacun, domaines exclus bloqués), reprise automatique sur `pause_turn`.
2. **Mise en forme** : second appel sans outils, sortie JSON validée par un schéma, dans la langue de l'utilisateur.
3. **Garde-fous** : seules les URL citées ou lues à l'étape 1 sont acceptées, doublons des 30 derniers jours rejetés, tri par pertinence, 10 infos max.

Les notes « utile / pas utile » des 90 derniers jours sont transmises à la recherche suivante du même thème. Une fois la veille enregistrée, un job de livraison l'envoie au webhook du compte ; un webhook en panne ne fait pas échouer la veille.

Une erreur temporaire (limite de débit, API indisponible) est réessayée deux fois avec un délai croissant ; une clé invalide ou un crédit épuisé échoue tout de suite avec un message lisible.

**Stack** : Next.js 16, TypeScript, Tailwind 4, Prisma 7, PostgreSQL 17, Better Auth, pg-boss, `@anthropic-ai/sdk`, Vitest, Playwright, Docker Compose, Caddy.

## Essayer en local

```bash
git clone https://github.com/seishiiinsan/digest.git
cd digest
docker compose up
```

L'app répond sur http://localhost:3000 et les emails (confirmation d'adresse, mot de passe oublié) arrivent dans Mailpit sur http://localhost:8025. Créez un compte, collez votre clé Anthropic dans les réglages, ajoutez un thème, puis « Générer maintenant ».

## Déployer sur un VPS

Prérequis : un enregistrement DNS `A` (et `AAAA`) du domaine vers le serveur, et Docker (Compose ≥ 2.24) avec les ports 80 et 443 ouverts. Sur un VPS Debian vierge, `deploy/setup-debian.sh` prépare tout en une commande (utilisateur avec clé SSH, SSH par clé uniquement, pare-feu, mises à jour de sécurité automatiques, Docker, swap) :

```bash
# en root, après avoir déposé votre clé SSH publique pour root
curl -fsSL https://raw.githubusercontent.com/seishiiinsan/digest/main/deploy/setup-debian.sh | sh -s -- gabin
```

Ensuite, connecté avec cet utilisateur :

```bash
git clone https://github.com/seishiiinsan/digest.git && cd digest
cp .env.example .env
```

Dans `.env`, renseignez au moins :

| Variable | Valeur |
| --- | --- |
| `DOMAIN` | `digest.example.com` |
| `POSTGRES_PASSWORD` | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | `openssl rand -base64 32`, à conserver : sans elle, les clés API enregistrées sont perdues |
| `SMTP_URL` | `smtps://utilisateur:motdepasse@smtp.example.com:465` |
| `MAIL_FROM` | `Digest <digest@example.com>` |
| `ADMIN_EMAILS` | votre email, pour la page `/admin` |
| `SIGNUP_ENABLED` | `false` pour fermer les inscriptions |

Puis :

```bash
docker compose -f compose.yaml -f deploy/compose.prod.yaml up -d
```

La surcouche de production utilise l'image publiée `ghcr.io/seishiiinsan/digest` (`DIGEST_VERSION`, `latest` par défaut), n'expose que Caddy (HTTPS automatique via Let's Encrypt), désactive Mailpit et ajoute une sauvegarde quotidienne. Seul Caddy fait face à internet : il remplace l'en-tête `X-Forwarded-For` par l'IP réelle, ce qui garantit la limite de débit par IP.

**Mettre à jour** : `DIGEST_VERSION=v1.2.0` dans `.env`, puis `docker compose -f compose.yaml -f deploy/compose.prod.yaml pull && docker compose -f compose.yaml -f deploy/compose.prod.yaml up -d`. Les migrations s'appliquent au démarrage. Lisez d'abord les notes de release : un changement cassant y est signalé en tête avec la marche à suivre.

**Sauvegardes** : un `pg_dump` par jour dans `./backups`, conservé 14 jours (`BACKUP_RETENTION_DAYS`). Copiez ce dossier hors du serveur. Pour restaurer :

```bash
docker compose -f compose.yaml -f deploy/compose.prod.yaml exec -T db \
  pg_restore --clean --if-exists -U digest -d digest < backups/digest-AAAAMMJJ-HHMMSS.dump
```

**Changer la clé maître** sans perdre les secrets : depuis un clone avec les dépendances installées, `OLD_ENCRYPTION_KEY=<ancienne> ENCRYPTION_KEY=<nouvelle> DATABASE_URL=<url> pnpm rotate-key`, puis mettez à jour `.env` et redémarrez `web` et `worker`.

## Coûts

Chaque compte paie ses appels Claude sur sa propre clé. Ordre de grandeur, à confirmer sur de vrais runs : 0,10 à 0,20 $ par thème et par veille avec Claude Sonnet 5 et 5 recherches web (facturées 10 $ les 1 000). L'app affiche le coût estimé de chaque veille.

| Modèle | Entrée / sortie (par million de tokens) | Usage |
| --- | --- | --- |
| Claude Sonnet 5 (défaut) | 2 $ / 10 $ | Bon équilibre coût et qualité |
| Claude Opus 5 | 5 $ / 25 $ | Thèmes pointus |
| Claude Haiku 4.5 | 1 $ / 5 $ | Veille large et peu coûteuse |

## Sécurité

- Clés API et webhooks chiffrés en AES-256-GCM, clé maître hors base, jamais renvoyés au navigateur ni journalisés.
- Mots de passe en Argon2id, 10 caractères minimum, vérifiés contre Have I Been Pwned. Email vérifié obligatoire, lien de réinitialisation à usage unique valable 30 minutes.
- Limite de débit par IP et par email sur la connexion, l'inscription et la réinitialisation.
- Toutes les données sont filtrées par compte ; des tests d'intégration vérifient qu'un compte ne peut ni lire ni modifier celles d'un autre. Supprimer son compte efface tout.
- Les pages lues par Claude sont traitées comme des données ; la mise en forme n'a accès à aucun outil. Les webhooks sortants ne visent que Discord ou Slack.

## Développer

Prérequis : Node 24 (voir `.nvmrc`), pnpm 10 (`corepack enable`), Docker.

```bash
cp .env.example .env
pnpm install
docker compose up -d db mailpit
pnpm db:deploy    # applique les migrations
pnpm dev          # web sur http://localhost:3000
pnpm dev:worker   # worker en mode watch
```

| Script | Effet |
| --- | --- |
| `pnpm lint` / `pnpm typecheck` | ESLint / types des routes Next + `tsc` |
| `pnpm test` | Tests unitaires Vitest |
| `pnpm test:integration` | Vitest contre la base (pipeline, isolation des comptes, livraison) |
| `pnpm test:e2e` | Playwright sur le build (`pnpm build` avant, db et mailpit lancés) |
| `pnpm build` / `pnpm build:worker` | Build Next.js / bundle du worker (`dist/worker.mjs`) |
| `pnpm db:migrate` | Nouvelle migration à partir de `prisma/schema.prisma` |
| `CAPTURES=1 pnpm test:e2e e2e/captures.spec.ts` | Régénère les captures du README |

```
prisma/            schéma et migrations
src/app/           Next.js (pages, routes API, server actions)
src/lib/           code partagé web + worker (auth, chiffrement, données, livraison)
src/pipeline/      recherche, mise en forme, dédoublonnage, coûts
src/worker/        planificateur et files pg-boss
e2e/               parcours Playwright
deploy/            production : Compose, Caddy, sauvegardes
docs/              cahier des charges, captures
```

## Licence

[AGPL-3.0-or-later](LICENSE). Vous pouvez utiliser, modifier et héberger Digest ; si vous proposez une version modifiée en ligne, vous devez en publier le code source sous la même licence.

## Contribuer

Conventions de branches, commits (`<type>: <description>`), PR et releases : voir le [cahier des charges](docs/cahier-des-charges.md#conventions-git). Pousser un tag `vX.Y.Z` sur `main` publie l'image `ghcr.io/seishiiinsan/digest:vX.Y.Z` (et `latest`) et crée la release GitHub avec ses notes.
