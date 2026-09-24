import type { Metadata } from "next";
import Link from "next/link";
import { ItemCard } from "@/components/item-card";
import { formatDateTime } from "@/lib/format";
import { requireUserData } from "@/lib/session";

export const metadata: Metadata = { title: "Veilles · Digest" };

const PAGE_SIZE = 30;

export default async function FeedPage({ searchParams }: PageProps<"/veilles">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 200) : "";
  const starred = params.favoris === "1";
  const topicId = typeof params.theme === "string" ? params.theme : "";
  const page = Math.max(1, Number(params.page) || 1);

  const { data } = await requireUserData();
  const [{ items, total }, topics, profile] = await Promise.all([
    data.feed({ query, starred, topicId: topicId || undefined, take: PAGE_SIZE * page }),
    data.topics(),
    data.profile(),
  ]);
  const filtered = Boolean(query || starred || topicId);

  // Regroupement par veille, dans l'ordre du fil.
  const groups: { digestId: string; createdAt: Date; items: typeof items }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last?.digestId === item.digest.id) last.items.push(item);
    else groups.push({ digestId: item.digest.id, createdAt: item.digest.createdAt, items: [item] });
  }

  const more = new URLSearchParams({ ...(query && { q: query }), ...(starred && { favoris: "1" }), ...(topicId && { theme: topicId }), page: String(page + 1) });

  return (
    <>
      <h1 className="text-2xl font-semibold">Veilles</h1>

      {/* key : remet les champs à zéro quand les filtres changent (navigation côté client). */}
      <form key={`${query}|${topicId}|${starred}`} className="flex flex-wrap items-end gap-3 text-sm" role="search">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="font-medium">Rechercher</span>
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="React, CVE, Kubernetes…"
            className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-medium">Thème</span>
          <select name="theme" defaultValue={topicId} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
            <option value="">Tous</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 py-2">
          <input type="checkbox" name="favoris" value="1" defaultChecked={starred} />
          Favoris
        </label>
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          Filtrer
        </button>
        {filtered && (
          <Link href="/veilles" className="py-2 text-zinc-500 underline underline-offset-4">
            Réinitialiser
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filtered ? (
            "Aucune info ne correspond à ces filtres."
          ) : (
            <>
              Aucune veille pour l&apos;instant. Lancez-en une depuis le{" "}
              <Link href="/tableau" className="underline underline-offset-4">
                tableau de bord
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.digestId} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-zinc-500">
                <Link href={`/veilles/${group.digestId}`} className="hover:underline">
                  Veille du {formatDateTime(group.createdAt, profile.timezone)}
                </Link>
              </h2>
              {group.items.map((item) => (
                <ItemCard key={item.id} item={item} timeZone={profile.timezone} />
              ))}
            </section>
          ))}
          {total > items.length && (
            <Link href={`/veilles?${more}`} className="self-start text-sm underline underline-offset-4">
              Voir plus ({total - items.length} restantes)
            </Link>
          )}
        </div>
      )}
    </>
  );
}
