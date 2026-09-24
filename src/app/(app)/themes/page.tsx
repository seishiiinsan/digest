import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/form";
import { requireUserData } from "@/lib/session";
import { TOPIC_TEMPLATES } from "@/lib/topic-templates";
import { createFromTemplate, deleteTopic, setTopicActive } from "./actions";

export const metadata: Metadata = { title: "Rubriques · Digest" };

const DETAIL_LABEL = { short: "brèves", standard: "articles", detailed: "dossiers" } as const;

export default async function TopicsPage() {
  const { data } = await requireUserData();
  const topics = await data.topics();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <PageHeader kicker="Les rubriques" title="Ce que votre journal couvre.">
          Une rubrique par sujet suivi : Claude cherche, vérifie et résume ce qui s&apos;y est passé depuis la dernière édition.
        </PageHeader>
        <Link href="/themes/nouveau" className="btn">
          Nouvelle rubrique
        </Link>
      </div>

      {topics.length === 0 ? (
        <p className="font-display text-2xl italic text-ink-2">Aucune rubrique pour l&apos;instant. Créez-en une ou partez d&apos;un modèle.</p>
      ) : (
        <ol className="flex flex-col border-t-2 border-ink">
          {topics.map((topic, index) => (
            <li
              key={topic.id}
              data-testid="topic"
              className={`rule-hair grid gap-4 py-6 first:border-t-0 sm:grid-cols-[3rem_1fr_auto] ${topic.active ? "" : "opacity-60"}`}
            >
              <span className="font-display text-3xl italic text-accent tabular">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h2 className="text-2xl font-semibold leading-tight">{topic.title}</h2>
                  {!topic.active && <span className="stamp -rotate-2 text-accent">désactivé</span>}
                </div>
                {topic.description && <p className="text-base leading-snug text-ink-2">{topic.description}</p>}
                <p className="kicker normal-case tracking-normal">
                  {topic.keywords.length > 0 && <span className="text-ink-2">{topic.keywords.join(" · ")}</span>}
                  {topic.keywords.length > 0 && " — "}
                  en {DETAIL_LABEL[topic.detailLevel]}
                  {topic.includeDomains.length > 0 && ` · priorité à ${topic.includeDomains.slice(0, 3).join(", ")}`}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2 sm:justify-end">
                <Link href={`/themes/${topic.id}`} className="btn btn-small btn-ghost">
                  Modifier
                </Link>
                <form action={setTopicActive.bind(null, topic.id, !topic.active)}>
                  <button type="submit" className="btn btn-small btn-ghost">
                    {topic.active ? "Désactiver" : "Activer"}
                  </button>
                </form>
                <form action={deleteTopic.bind(null, topic.id)}>
                  <button type="submit" className="btn btn-small btn-ghost btn-danger">
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ol>
      )}

      <section className="flex flex-col gap-5">
        <div className="rule-double pt-3">
          <p className="kicker text-accent">Rubriques prêtes à l&apos;emploi</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {TOPIC_TEMPLATES.map((template) => (
            <form key={template.slug} action={createFromTemplate.bind(null, template.slug)}>
              <button
                type="submit"
                className="group flex h-full w-full flex-col gap-2 border-2 border-dashed border-ink-3 p-5 text-left transition-colors hover:border-accent hover:bg-paper-2"
              >
                <span className="font-display text-xl font-semibold group-hover:text-accent">+ {template.title}</span>
                <span className="text-base leading-snug text-ink-2">{template.description}</span>
                <span className="kicker normal-case tracking-normal">{template.keywords.join(" · ")}</span>
              </button>
            </form>
          ))}
        </div>
      </section>
    </>
  );
}
