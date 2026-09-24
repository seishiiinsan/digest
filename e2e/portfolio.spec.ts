import { signUpAndVerify, test } from "./helpers";
import { deleteUser } from "./seed";
import { getPrisma } from "@/lib/db";
import { userData } from "@/lib/user-data";
import { nextRunAt } from "@/lib/schedule";

// Captures 16:9 pour la présentation du projet : PORTFOLIO_DIR=… pnpm test:e2e e2e/portfolio.spec.ts
test.skip(!process.env.PORTFOLIO_DIR, "captures portfolio à la demande");
const dir = process.env.PORTFOLIO_DIR!;
const EMAIL = "gabin@digest.demo";
const DAY = 86_400_000;

type Cat = "release" | "announcement" | "article" | "security" | "trend";
interface Seed { topic: number; cat: Cat; rel: number; title: string; summary: string; why: string; src: [string, string, string, string?][] }

const TOPICS = [
  { title: "Front-end", description: "Nouveautés des frameworks web, CSS et navigateurs : releases, RFC et changements qui impactent le code.", keywords: ["Orbit.js", "CSS", "TypeScript", "navigateurs"], includeDomains: ["orbitjs.dev", "web.dev"], detailLevel: "standard" as const },
  { title: "Supply chain", description: "Failles critiques et incidents touchant l'écosystème open source et nos dépendances.", keywords: ["CVE", "supply chain", "npm"], includeDomains: ["github.blog"], detailLevel: "short" as const },
  { title: "IA et LLM", description: "Sorties de modèles, nouveautés des API et pratiques pour construire avec l'IA générative.", keywords: ["agents", "RAG", "évaluation"], includeDomains: [], detailLevel: "detailed" as const },
  { title: "DevOps", description: "Conteneurs, CI/CD et observabilité : versions, dépréciations et bonnes pratiques.", keywords: ["Kubernetes", "OpenTelemetry", "CI"], includeDomains: [], detailLevel: "standard" as const },
];

const TODAY: Seed[] = [
  { topic: 1, cat: "security", rel: 5, title: "Faille critique dans le plugin CI « Pipewright » : correctif à appliquer avant lundi", summary: "Une injection de commande permet d'exécuter du code arbitraire sur les runners via un nom de branche piégé. La version 3.8.2 corrige le problème ; toutes les versions 3.x antérieures sont concernées et un exploit public circule depuis mercredi.", why: "Vos pipelines utilisent Pipewright 3.7 : la mise à jour est prioritaire.", src: [["https://pipewright.io/advisories/2026-014", "Security advisory PW-2026-014", "pipewright.io", "Branch names containing shell metacharacters were interpolated without escaping."], ["https://github.blog/security/pipewright-rce", "Coordinated disclosure: Pipewright RCE", "github.blog"]] },
  { topic: 0, cat: "release", rel: 5, title: "Orbit.js 5 passe le rendu serveur par défaut", summary: "Le mode hybride devient la norme : les composants sont rendus côté serveur sauf opt-in explicite. Le bundle client fond de 30 % sur les applications de démonstration et un codemod automatise l'essentiel de la migration.", why: "Migration à planifier pour vos deux applications Orbit, le codemod couvre la plupart des cas.", src: [["https://orbitjs.dev/blog/orbit-5", "Orbit 5 is here", "orbitjs.dev", "Server rendering is now the default for every component."], ["https://orbitjs.dev/docs/migrate-5", "Migrating to Orbit 5", "orbitjs.dev"]] },
  { topic: 2, cat: "announcement", rel: 4, title: "Les API de génération acceptent désormais des budgets de tâche", summary: "Un nouveau paramètre permet de fixer un plafond de tokens pour une boucle d'agent entière : le modèle adapte sa stratégie pour conclure avant la limite au lieu d'être coupé en plein raisonnement.", why: "Utile pour borner le coût de vos agents de support sans dégrader les réponses.", src: [["https://llm-weekly.example/task-budgets", "Task budgets land in generation APIs", "llm-weekly.example"]] },
  { topic: 3, cat: "release", rel: 4, title: "OpenTelemetry stabilise la spécification des logs pour les conteneurs", summary: "Les attributs de ressources pour les conteneurs passent en statut stable. Les collecteurs peuvent désormais enrichir chaque ligne de log avec l'image, le pod et le nœud sans configuration spécifique.", why: "Simplifie la corrélation logs / traces dans votre stack d'observabilité.", src: [["https://opentelemetry.example/blog/container-logs", "Container resource attributes are stable", "opentelemetry.example"]] },
  { topic: 0, cat: "article", rel: 3, title: "Le positionnement par ancre CSS disponible dans tous les navigateurs", summary: "Avec la dernière version du navigateur de Mozilla, le positionnement par ancre est supporté partout : infobulles et menus se placent sans une ligne de JavaScript.", why: "Vous pouvez retirer la bibliothèque de positionnement de votre design system.", src: [["https://web.dev/blog/anchor-positioning-baseline", "Anchor positioning is Baseline", "web.dev"]] },
  { topic: 2, cat: "trend", rel: 3, title: "Les agents entrent dans les éditeurs de schémas de base de données", summary: "Trois outils proposent désormais des migrations générées par un agent puis relues par un humain, avec tests de non-régression automatiques.", why: "Piste pour accélérer vos migrations Prisma sans perdre la relecture.", src: [["https://dbweekly.example/agents-schema", "Agents meet schema editors", "dbweekly.example"]] },
  { topic: 3, cat: "article", rel: 2, title: "Retour d'expérience : diviser par deux le temps de CI avec le cache distant", summary: "Une équipe de 40 développeurs détaille comment un cache de build distant a fait passer sa CI de 22 à 10 minutes.", why: "Chiffres utiles pour estimer le gain sur votre propre pipeline.", src: [["https://engineering.example/ci-remote-cache", "Halving CI time with remote caching", "engineering.example"]] },
];
const YESTERDAY: Seed[] = [
  { topic: 0, cat: "release", rel: 4, title: "TypeScript 7.1 accélère la vérification des projets monorepo", summary: "Le nouveau vérificateur réutilise les résultats entre projets référencés.", why: "Temps de typecheck réduit sur votre monorepo.", src: [["https://typescript.example/7-1", "Announcing TypeScript 7.1", "typescript.example"]] },
  { topic: 1, cat: "security", rel: 4, title: "Paquet npm compromis : 12 000 installations avant retrait", summary: "Un mainteneur piraté a publié une version volant les variables d'environnement.", why: "Vérifiez vos lockfiles : la version compromise est une dépendance indirecte courante.", src: [["https://github.blog/security/npm-compromise", "Compromised npm package removed", "github.blog"]] },
  { topic: 2, cat: "article", rel: 3, title: "Évaluer un agent : les métriques qui comptent vraiment", summary: "Taux de tâches terminées et coût par tâche réussie plutôt que score par requête.", why: "Grille reprise telle quelle pour vos évaluations internes.", src: [["https://evals.example/agent-metrics", "Metrics that matter for agents", "evals.example"]] },
];

function item(s: Seed, topicIds: string[], salt: string) {
  return {
    topicId: topicIds[s.topic], title: s.title, category: s.cat, summary: s.summary, whyItMatters: s.why, relevance: s.rel,
    urlHash: `${salt}-${s.title}`,
    starred: s.rel === 5 && s.topic === 0,
    sources: { create: s.src.map(([url, title, domain, citedText]) => ({ url, title, domain, citedText: citedText ?? null, publishedAt: null })) },
  };
}

test.use({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });

test("captures portfolio", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const prisma = getPrisma();
  await deleteUser(EMAIL);
  await signUpAndVerify(page, EMAIL);
  const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
  const data = userData(prisma, user.id);
  await prisma.user.update({ where: { id: user.id }, data: { timezone: "Europe/Paris", locale: "fr" } });
  await data.saveApiKey("sk-ant-api03-demo-portfolio-key-7Qx2", "claude-sonnet-5");
  const topicIds: string[] = [];
  for (const t of TOPICS) topicIds.push((await data.createTopic({ ...t, excludeDomains: [] })).id);
  await data.saveSchedule({ frequency: "daily", weekday: null, hour: 7, paused: false });
  await data.saveDelivery("https://discord.com/api/webhooks/1188/demo-portfolio-token-x9Qa", "discord", "discord.com/api/webhooks/1188/…x9Qa");

  const now = Date.now();
  const digests: string[] = [];
  const editions: [Seed[], number, number][] = [[YESTERDAY, 1, 0.31], [TODAY, 0, 0.47]];
  for (const [seeds, daysAgo, cost] of editions) {
    const at = new Date(now - daysAgo * DAY - (daysAgo ? 0 : 60_000));
    at.setUTCHours(5, 2, 0, 0);
    if (daysAgo === 0 && at.getTime() > now) at.setTime(now - 3_600_000);
    const run = await prisma.run.create({
      data: { userId: user.id, trigger: "scheduled", status: "succeeded", model: "claude-sonnet-5", topicsTotal: 4, topicsDone: 4, startedAt: at, finishedAt: new Date(at.getTime() + 140_000), inputTokens: 184_320, cacheReadTokens: 41_200, outputTokens: 9_870, searches: 18, costUsd: cost, createdAt: at },
    });
    const digest = await prisma.digest.create({
      data: { runId: run.id, userId: user.id, language: "fr", createdAt: at, deliveredAt: new Date(at.getTime() + 150_000), items: { create: seeds.map((s) => item(s, topicIds, run.id)) } },
    });
    digests.push(digest.id);
  }
  await prisma.run.create({ data: { userId: user.id, trigger: "manual", status: "failed", model: "claude-haiku-4-5", topicsTotal: 4, topicsDone: 0, error: "Crédit insuffisant sur le compte Anthropic de cette clé.", createdAt: new Date(now - 3 * DAY) } });
  const running = await prisma.run.create({ data: { userId: user.id, trigger: "manual", status: "running", model: "claude-sonnet-5", topicsTotal: 4, topicsDone: 2, startedAt: new Date(now - 50_000), inputTokens: 91_000, outputTokens: 4_100, searches: 9, costUsd: 0.21 } });

  const shot = (name: string) => page.screenshot({ path: `${dir}/${name}.png` });

  await page.goto("/executions/" + running.id);
  await page.getByTestId("run-progress").waitFor();
  await shot("06-impression-en-cours");
  await prisma.run.update({ where: { id: running.id }, data: { status: "succeeded", topicsDone: 4, finishedAt: new Date(), costUsd: 0.44, createdAt: new Date(now - 2 * DAY) } });

  await page.goto("/veilles/" + digests[1]);
  await page.mouse.move(0, 0);
  await shot("02-edition-du-jour");

  await page.goto("/veilles");
  await page.getByTestId("digest-item").nth(1).locator("summary").click();
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, 330));
  await shot("03-fil-des-editions");

  await page.goto("/themes");
  await shot("04-rubriques");

  await page.goto("/reglages");
  await shot("05-reglages");

  await page.goto("/executions");
  await shot("07-rotative");

  const dark = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark", storageState: await page.context().storageState(), baseURL: "http://localhost:3000" });
  const night = await dark.newPage();
  await night.goto("/tableau");
  await night.screenshot({ path: `${dir}/08-redaction-edition-de-nuit.png` });
  await night.goto("/veilles/" + digests[1]);
  await night.mouse.move(0, 0);
  await night.evaluate(() => window.scrollTo(0, 280));
  await night.screenshot({ path: `${dir}/09-edition-de-nuit.png` });
  await dark.close();

  const anon = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2, baseURL: "http://localhost:3000" });
  const visitor = await anon.newPage();
  await visitor.goto("/");
  await visitor.screenshot({ path: `${dir}/01-une.png` });
  await visitor.evaluate(() => window.scrollTo(0, 1180));
  await visitor.screenshot({ path: `${dir}/10-charte.png` });
  await visitor.goto("/inscription");
  await visitor.screenshot({ path: `${dir}/11-bulletin-d-abonnement.png` });
  await anon.close();
  void nextRunAt;
});
