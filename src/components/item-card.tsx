import { rate, toggleStar } from "@/app/(app)/veilles/actions";
import { Relevance } from "@/components/relevance";
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

const SUPERSCRIPT = ["¹", "²", "³", "⁴", "⁵"];

function Toggle({ pressed, action, children }: { pressed: boolean; action: () => Promise<void>; children: React.ReactNode }) {
  return (
    <form action={action}>
      <button type="submit" aria-pressed={pressed} className={`btn btn-small ${pressed ? "" : "btn-ghost"}`}>
        {children}
      </button>
    </form>
  );
}

// Un article de l'édition : replié sur son titre, déplié sur le chapeau, l'analyse et les sources en notes.
export function ItemCard({ item, timeZone, open = false, lead = false }: { item: ItemCardData; timeZone: string; open?: boolean; lead?: boolean }) {
  return (
    <details open={open} className="group rule-hair py-6 first:border-t-0" data-testid="digest-item">
      <summary className="flex cursor-pointer list-none flex-col gap-2 [&::-webkit-details-marker]:hidden">
        <span className="kicker flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={item.category === "security" ? "text-accent" : "text-ink-2"}>{CATEGORY_LABEL[item.category]}</span>
          {item.topic && <span>{item.topic.title}</span>}
          <Relevance value={item.relevance} />
          {item.starred && <span className="text-accent">★ Favori</span>}
        </span>
        <span
          className={`font-display font-semibold leading-[1.08] tracking-tight transition-colors group-hover:text-accent ${
            lead ? "text-3xl sm:text-4xl" : "text-2xl"
          }`}
        >
          {item.title}
        </span>
        <span className="kicker text-ink-3 group-open:hidden">Lire l&apos;article +</span>
      </summary>

      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_16rem]">
        <div className="flex flex-col gap-4">
          <p className={`text-lg leading-relaxed ${lead ? "dropcap" : ""}`}>{item.summary}</p>
          <blockquote className="border-l-4 border-accent pl-4 font-display text-lg italic leading-snug text-ink-2">
            <span className="kicker not-italic text-accent">Pourquoi c&apos;est important : </span>
            {item.whyItMatters}
          </blockquote>
          <div className="flex flex-wrap gap-2 pt-1">
            <Toggle pressed={item.starred} action={toggleStar.bind(null, item.id, !item.starred)}>
              {item.starred ? "★ Favori" : "☆ Favori"}
            </Toggle>
            <Toggle pressed={item.feedback === "useful"} action={rate.bind(null, item.id, item.feedback === "useful" ? null : "useful")}>
              Utile
            </Toggle>
            <Toggle
              pressed={item.feedback === "not_useful"}
              action={rate.bind(null, item.id, item.feedback === "not_useful" ? null : "not_useful")}
            >
              Pas utile
            </Toggle>
          </div>
        </div>

        <aside className="flex flex-col gap-3 border-t border-rule pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <p className="kicker">Sources</p>
          <ol className="flex flex-col gap-3 text-sm">
            {item.sources.map((source, index) => (
              <li key={source.id} className="flex gap-2">
                <span className="font-display text-accent">{SUPERSCRIPT[index] ?? index + 1}</span>
                <div className="flex min-w-0 flex-col gap-1">
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="link break-words font-medium">
                    {source.title}
                  </a>
                  <span className="kicker normal-case tracking-normal">
                    {source.domain}
                    {source.publishedAt && ` · ${formatDateTime(source.publishedAt, timeZone)}`}
                  </span>
                  {source.citedText && <span className="italic text-ink-2">«{"\u00a0"}{source.citedText}{"\u00a0"}»</span>}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </details>
  );
}
