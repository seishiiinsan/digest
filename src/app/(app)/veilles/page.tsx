import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/form";
import { ItemCard } from "@/components/item-card";
import { formatLongDate, formatTime } from "@/lib/format";
import { requireUserData } from "@/lib/session";

export const metadata: Metadata = { title: "Éditions · Digest" };

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

  // Regroupement par édition, dans l'ordre du fil.
  const groups: { digestId: string; createdAt: Date; items: typeof items }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last?.digestId === item.digest.id) last.items.push(item);
    else groups.push({ digestId: item.digest.id, createdAt: item.digest.createdAt, items: [item] });
  }

  const more = new URLSearchParams({
    ...(query && { q: query }),
    ...(starred && { favoris: "1" }),
    ...(topicId && { theme: topicId }),
    page: String(page + 1),
  });

  return (
    <>
      <PageHeader kicker="Les éditions" title="Tout ce qui a compté, édition par édition.">
        Dépliez un titre pour lire l&apos;article et ses sources. Vos notes affinent les éditions suivantes.
      </PageHeader>

      {/* key : remet les champs à zéro quand les filtres changent (navigation côté client). */}
      <form
        key={`${query}|${topicId}|${starred}`}
        role="search"
        className="grid items-end gap-5 border-y-2 border-ink py-5 sm:grid-cols-[1fr_12rem_auto_auto]"
      >
        <label className="flex flex-col gap-1">
          <span className="kicker text-ink-2">Rechercher</span>
          <input name="q" type="search" defaultValue={query} placeholder="React, CVE, Kubernetes…" className="field" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-ink-2">Rubrique</span>
          <select name="theme" defaultValue={topicId} className="field">
            <option value="">Toutes les rubriques</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 pb-2 text-base">
          <input type="checkbox" name="favoris" value="1" defaultChecked={starred} className="checkbox" />
          Favoris
        </label>
        <div className="flex items-center gap-4">
          <button type="submit" className="btn">
            Filtrer
          </button>
          {filtered && (
            <Link href="/veilles" className="link text-base">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <p className="font-display text-2xl italic text-ink-2">
          {filtered ? (
            "Aucune info ne correspond à ces filtres."
          ) : (
            <>
              Aucune édition pour l&apos;instant. Lancez la première depuis la{" "}
              <Link href="/tableau" className="link">
                rédaction
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-14">
          {groups.map((group, groupIndex) => (
            <section key={group.digestId} className="flex flex-col">
              <div className="rule-thick flex flex-wrap items-baseline justify-between gap-2 pt-2">
                <h2 className="font-display text-xl font-semibold first-letter:uppercase">
                  <Link href={`/veilles/${group.digestId}`} className="hover:text-accent">
                    {formatLongDate(group.createdAt, profile.timezone)}
                  </Link>
                </h2>
                <span className="kicker">
                  Édition de {formatTime(group.createdAt, profile.timezone)} · {group.items.length} info(s)
                </span>
              </div>
              {group.items.map((item, index) => (
                <ItemCard key={item.id} item={item} timeZone={profile.timezone} lead={!filtered && groupIndex === 0 && index === 0} />
              ))}
            </section>
          ))}
          {total > items.length && (
            <Link href={`/veilles?${more}`} className="btn btn-ghost self-center">
              Voir plus ({total - items.length} restantes)
            </Link>
          )}
        </div>
      )}
    </>
  );
}
