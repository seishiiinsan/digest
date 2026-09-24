import type { Metadata } from "next";
import Link from "next/link";
import { requireUserData } from "@/lib/session";
import { TOPIC_TEMPLATES } from "@/lib/topic-templates";
import { createFromTemplate, deleteTopic, setTopicActive } from "./actions";

export const metadata: Metadata = { title: "Thèmes · Digest" };

const button = "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";

export default async function TopicsPage() {
  const { data } = await requireUserData();
  const topics = await data.topics();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Thèmes</h1>
        <Link
          href="/themes/nouveau"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Nouveau thème
        </Link>
      </div>

      {topics.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Aucun thème pour l&apos;instant. Créez-en un ou partez d&apos;un modèle.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {topics.map((topic) => (
            <li
              key={topic.id}
              data-testid="topic"
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-medium">{topic.title}</h2>
                {!topic.active && <span className="text-xs uppercase text-zinc-500">désactivé</span>}
              </div>
              {topic.description && <p className="text-sm text-zinc-600 dark:text-zinc-400">{topic.description}</p>}
              {topic.keywords.length > 0 && <p className="text-xs text-zinc-500">{topic.keywords.join(" · ")}</p>}
              <div className="flex flex-wrap gap-2">
                <Link href={`/themes/${topic.id}`} className={button}>
                  Modifier
                </Link>
                <form action={setTopicActive.bind(null, topic.id, !topic.active)}>
                  <button type="submit" className={button}>
                    {topic.active ? "Désactiver" : "Activer"}
                  </button>
                </form>
                <form action={deleteTopic.bind(null, topic.id)}>
                  <button type="submit" className={button}>
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Modèles prêts</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOPIC_TEMPLATES.map((template) => (
            <form key={template.slug} action={createFromTemplate.bind(null, template.slug)}>
              <button
                type="submit"
                className="flex h-full w-full flex-col gap-1 rounded-xl border border-dashed border-zinc-300 p-4 text-left text-sm dark:border-zinc-700"
              >
                <span className="font-medium">+ {template.title}</span>
                <span className="text-zinc-600 dark:text-zinc-400">{template.description}</span>
              </button>
            </form>
          ))}
        </div>
      </section>
    </>
  );
}
