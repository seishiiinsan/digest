import { rate, toggleStar } from "@/app/(app)/veilles/actions";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/format";

export interface ItemCardData {
  id: string;
  title: string;
  category: keyof typeof CATEGORY_LABEL;
  summary: string;
  whyItMatters: string;
  relevance: number;
  starred: boolean;
  feedback: "useful" | "not_useful" | null;
  topic: { title: string } | null;
  sources: { id: string; url: string; title: string; domain: string; publishedAt: Date | null; citedText: string | null }[];
}

const action = "rounded-lg border px-2.5 py-1 text-xs";
const on = "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900";
const off = "border-zinc-300 dark:border-zinc-700";

// Une info de veille : repliée sur son titre, dépliée sur le résumé, le « pourquoi » et les sources.
export function ItemCard({ item, timeZone, open = false }: { item: ItemCardData; timeZone: string; open?: boolean }) {
  return (
    <details open={open} className="group rounded-xl border border-zinc-200 p-4 dark:border-zinc-800" data-testid="digest-item">
      <summary className="flex cursor-pointer list-none flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          {CATEGORY_LABEL[item.category]}
          {item.topic && ` · ${item.topic.title}`} · {item.relevance}/5{item.starred && " · ★"}
        </span>
        <span className="font-medium">{item.title}</span>
      </summary>

      <div className="mt-3 flex flex-col gap-3">
        <p className="text-sm">{item.summary}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium">Pourquoi c&apos;est important : </span>
          {item.whyItMatters}
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          {item.sources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                {source.title}
              </a>{" "}
              <span className="text-zinc-500">
                · {source.domain}
                {source.publishedAt && ` · ${formatDateTime(source.publishedAt, timeZone)}`}
              </span>
              {source.citedText && (
                <blockquote className="mt-1 border-l-2 border-zinc-300 pl-3 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                  {source.citedText}
                </blockquote>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <form action={toggleStar.bind(null, item.id, !item.starred)}>
            <button type="submit" className={`${action} ${item.starred ? on : off}`} aria-pressed={item.starred}>
              {item.starred ? "★ Favori" : "☆ Favori"}
            </button>
          </form>
          <form action={rate.bind(null, item.id, item.feedback === "useful" ? null : "useful")}>
            <button type="submit" className={`${action} ${item.feedback === "useful" ? on : off}`} aria-pressed={item.feedback === "useful"}>
              Utile
            </button>
          </form>
          <form action={rate.bind(null, item.id, item.feedback === "not_useful" ? null : "not_useful")}>
            <button
              type="submit"
              className={`${action} ${item.feedback === "not_useful" ? on : off}`}
              aria-pressed={item.feedback === "not_useful"}
            >
              Pas utile
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
