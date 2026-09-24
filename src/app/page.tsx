import Link from "next/link";
import { Colophon } from "@/components/colophon";
import { Relevance } from "@/components/relevance";
import { formatLongDate } from "@/lib/format";
import { MODELS } from "@/lib/models";
import { getSession } from "@/lib/session";

const LAUNCH = Date.UTC(2026, 8, 24);

// Une d'exemple : noms et faits inventés, pour montrer le format.
const SAMPLE = [
  {
    category: "Sécurité",
    topic: "DevOps",
    relevance: 5,
    title: "Faille critique dans le plugin CI « Pipewright » : correctif à appliquer avant lundi",
    summary:
      "Une injection de commande permet d'exécuter du code sur les runners via un nom de branche piégé. La version 3.8.2 corrige le problème ; les versions 3.x antérieures sont toutes concernées.",
    why: "Vos pipelines utilisent Pipewright 3.7 : mise à jour prioritaire.",
    source: "pipewright.io",
  },
  {
    category: "Release",
    topic: "Front-end",
    relevance: 4,
    title: "Orbit.js 5 passe le rendu serveur par défaut",
    summary: "Le mode hybride devient la norme et le bundle client fond de 30 %.",
    why: "Migration à prévoir pour vos deux applications Orbit.",
    source: "orbitjs.dev",
  },
  {
    category: "Tendance",
    topic: "IA et LLM",
    relevance: 3,
    title: "Les agents entrent dans les éditeurs de schémas de base de données",
    summary: "Trois outils proposent désormais des migrations générées puis relues par un agent.",
    why: "Piste pour accélérer vos migrations Prisma.",
    source: "dbweekly.example",
  },
];

const STEPS = [
  { n: "I", title: "Abonnez-vous", text: "Un email, un mot de passe. Pas de carte bancaire : Digest ne facture rien." },
  { n: "II", title: "Branchez votre clé", text: "Votre clé Anthropic est testée, chiffrée, puis n'est plus jamais affichée." },
  { n: "III", title: "Ouvrez vos rubriques", text: "Un framework, un langage, un concurrent : décrivez-le comme à un journaliste." },
  { n: "IV", title: "Recevez l'édition", text: "Chaque matin ou chaque semaine, dans l'app, sur Discord ou sur Slack." },
];

const CHARTER = [
  {
    title: "Chaque info a sa source.",
    text: "Claude cherche et lit le web, puis rédige. Un lien qui n'a pas été réellement consulté est rejeté : aucune URL inventée n'atteint votre édition.",
  },
  {
    title: "Rien deux fois.",
    text: "Une information déjà publiée dans les 30 derniers jours n'est pas réimprimée. Vos notes « utile / pas utile » affinent les éditions suivantes.",
  },
  {
    title: "Votre clé, votre facture.",
    text: "Chaque compte paie ses propres appels, au prix Anthropic. Le coût réel de chaque édition est affiché au centime près.",
  },
  {
    title: "Vos pages, vos règles.",
    text: "Digest est un logiciel libre sous AGPL. Hébergez votre propre instance en une commande Docker, sur votre serveur.",
  },
];

const TICKER = ["Release", "Sécurité", "Annonce", "Tendance", "Article", "Sources citées", "Zéro doublon", "Votre langue", "Discord", "Slack"];

export default async function Home() {
  const session = await getSession();
  const now = new Date();
  const issue = Math.max(1, Math.floor((now.getTime() - LAUNCH) / 86_400_000) + 1);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Manchette */}
      <header className="mx-auto w-full max-w-6xl px-5 pt-5 sm:px-8">
        <div className="kicker flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-rule pb-2">
          <span className="inline-block first-letter:uppercase">{formatLongDate(now, "Europe/Paris")}</span>
          <span>N° {issue}</span>
          <span>Prix : votre clé API</span>
        </div>
        <div className="flex flex-col items-center gap-5 py-6 sm:gap-7 sm:py-8">
          <p className="wordmark text-[clamp(4.5rem,17vw,11rem)]">Digest</p>
          <p className="font-display text-lg italic text-ink-2 sm:text-xl">Le quotidien de votre veille techno</p>
        </div>
        <div className="rule-double" />
        <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-ink py-2.5">
          <span className="kicker hidden sm:inline">Open source · auto-hébergeable · propulsé par Claude</span>
          <div className="flex items-center gap-5">
            {session ? (
              <Link href="/tableau" className="btn btn-small">
                Ma rédaction
              </Link>
            ) : (
              <>
                <Link href="/connexion" className="link font-mono text-[0.78rem] uppercase tracking-[0.12em]">
                  Se connecter
                </Link>
                <Link href="/inscription" className="btn btn-small">
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-5 py-12 sm:px-8">
        {/* À la une */}
        <section className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div className="flex flex-col gap-6">
            <p className="kicker text-accent">À la une</p>
            <h1 className="text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Votre veille techno, écrite pour vous chaque matin. Sources à l&apos;appui.
            </h1>
            <p className="max-w-xl text-xl leading-relaxed text-ink-2">
              Fini les vingt onglets de newsletters. Choisissez vos rubriques : Claude parcourt le web, vérifie, écarte le bruit et vous livre
              une édition courte, dans votre langue, où chaque info renvoie à ses sources.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href={session ? "/tableau" : "/inscription"} className="btn px-6 py-3.5 text-[0.85rem]">
                {session ? "Ouvrir ma rédaction" : "Créer mon journal"}
              </Link>
              <a href="#exemple" className="link text-lg">
                Lire une édition d&apos;exemple
              </a>
            </div>
            <p className="kicker normal-case tracking-normal">≈ 0,10 à 0,20 $ par rubrique et par édition, facturés sur votre clé Anthropic.</p>
          </div>

          {/* Coupure de presse d'exemple */}
          <article id="exemple" className="relative scroll-mt-8 border-2 border-ink bg-paper-2 p-5 shadow-[8px_8px_0_var(--ink)] sm:p-7 lg:rotate-1">
            <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
              <span className="wordmark text-2xl">Digest</span>
              <span className="kicker">Édition d&apos;exemple · faits fictifs</span>
            </div>
            <ol className="flex flex-col">
              {SAMPLE.map((item, index) => (
                <li key={item.title} className="rule-hair flex flex-col gap-2 py-4 first:border-t-0">
                  <span className="kicker flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={item.category === "Sécurité" ? "text-accent" : "text-ink-2"}>{item.category}</span>
                    <span>{item.topic}</span>
                    <Relevance value={item.relevance} />
                  </span>
                  <h2 className={`font-semibold leading-tight tracking-tight ${index === 0 ? "text-2xl" : "text-lg"}`}>{item.title}</h2>
                  {index === 0 && <p className="dropcap text-base leading-relaxed">{item.summary}</p>}
                  <p className="border-l-2 border-accent pl-3 font-display text-base italic text-ink-2">{item.why}</p>
                  <p className="kicker normal-case tracking-normal">
                    <span className="text-accent">¹</span> {item.source}
                  </p>
                </li>
              ))}
            </ol>
          </article>
        </section>

        {/* Bandeau télex */}
        <div className="-mx-5 overflow-hidden border-y-2 border-ink bg-ink py-2.5 text-paper sm:-mx-8" aria-hidden>
          <div className="animate-ticker flex w-max gap-8 font-mono text-sm uppercase tracking-[0.18em]">
            {[...TICKER, ...TICKER].map((word, index) => (
              <span key={index} className="flex items-center gap-8">
                {word}
                <span className="text-accent">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* Comment ça marche */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="kicker text-accent">Mode d&apos;emploi</p>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Première édition en cinq minutes.</h2>
          </div>
          <ol className="grid border-t-2 border-ink sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li
                key={step.n}
                className={`flex flex-col gap-3 border-b border-rule py-6 sm:px-5 lg:border-b-0 ${index > 0 ? "lg:border-l" : "lg:pl-0"} ${
                  index % 2 === 1 ? "sm:border-l" : "sm:pl-0"
                }`}
              >
                <span className="font-display text-5xl italic text-accent">{step.n}.</span>
                <h3 className="text-2xl font-semibold">{step.title}</h3>
                <p className="text-base leading-relaxed text-ink-2">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Charte */}
        <section className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-3">
            <p className="kicker text-accent">La charte de la rédaction</p>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Quatre engagements, tenus par le code.</h2>
            <p className="text-lg text-ink-2">Pas des promesses de plaquette : chacun est vérifié par des tests automatisés à chaque modification.</p>
          </div>
          <div className="grid gap-x-10 sm:grid-cols-2">
            {CHARTER.map((item) => (
              <article key={item.title} className="rule-thick flex flex-col gap-3 pb-8 pt-4">
                <h3 className="text-2xl font-semibold leading-tight">{item.title}</h3>
                <p className="text-base leading-relaxed text-ink-2">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Prix au numéro */}
        <section className="grid gap-10 border-2 border-ink p-6 sm:p-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col gap-3">
            <p className="kicker text-accent">Prix au numéro</p>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">Digest est gratuit. Claude, lui, se paie au mot.</h2>
            <p className="text-lg text-ink-2">
              Vous choisissez le modèle, Anthropic vous facture directement. Avec trois rubriques quotidiennes sur Claude Sonnet 5, comptez environ
              10 à 20 $ par mois.
            </p>
          </div>
          <table className="w-full self-center text-left">
            <thead>
              <tr className="kicker border-b-2 border-ink">
                <th className="py-2 pr-4 font-medium">Modèle</th>
                <th className="py-2 pr-4 font-medium">Entrée / sortie</th>
                <th className="py-2 font-medium">Pour</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((model) => (
                <tr key={model.id} className="border-b border-rule align-baseline">
                  <td className="py-3 pr-4 font-display text-lg font-semibold">{model.label}</td>
                  <td className="py-3 pr-4 font-mono text-sm tabular">
                    {model.input} $ / {model.output} $
                  </td>
                  <td className="py-3 text-base text-ink-2">{model.hint}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="kicker pt-3 normal-case tracking-normal">
                  Par million de tokens. Recherches web : 10 $ les 1 000.
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Auto-hébergement */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="kicker text-accent">Imprimerie maison</p>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Votre propre rotative, en une commande.</h2>
            <p className="text-lg leading-relaxed text-ink-2">
              Digest est open source (AGPL). Postgres, application, worker et HTTPS automatique tiennent dans un petit VPS. Les clés API
              restent chiffrées chez vous.
            </p>
            <Link href="https://github.com/seishiiinsan/digest" className="link self-start text-lg">
              Lire le code source sur GitHub →
            </Link>
          </div>
          <pre className="overflow-x-auto border-2 border-ink bg-ink p-6 font-mono text-sm leading-relaxed text-paper">
            <code>
              <span className="text-ink-3"># cloner, lancer, lire</span>
              {"\n"}git clone https://github.com/seishiiinsan/digest{"\n"}cd digest{"\n"}docker compose up{"\n\n"}
              <span className="text-accent">✓</span> Digest répond sur http://localhost:3000
            </code>
          </pre>
        </section>

        {/* Dernier appel */}
        <section className="flex flex-col items-center gap-6 border-y-4 border-double border-ink py-14 text-center">
          <p className="kicker text-accent">Dernière minute</p>
          <h2 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Demain matin, votre veille tient sur une page.
          </h2>
          <Link href={session ? "/tableau" : "/inscription"} className="btn px-7 py-4 text-[0.9rem]">
            {session ? "Ouvrir ma rédaction" : "Créer mon journal"}
          </Link>
        </section>
      </main>

      <Colophon wide />
    </div>
  );
}
