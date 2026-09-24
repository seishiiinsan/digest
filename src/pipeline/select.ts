import type { FormattedItem } from "./format";
import type { ResearchSource } from "./research";
import { domainOf, normalizeUrl, urlHash } from "./urls";

export const MAX_ITEMS_PER_TOPIC = 10;

export interface SelectedSource {
  url: string;
  title: string;
  domain: string;
  publishedAt: Date | null;
  citedText: string | null;
}

export interface SelectedItem {
  title: string;
  category: FormattedItem["category"];
  summary: string;
  whyItMatters: string;
  relevance: number;
  urlHash: string;
  sources: SelectedSource[];
}

// Garde-fous après la mise en forme :
// - seules les URL issues de la recherche sont acceptées (pas de lien inventé) ;
// - un item sans source valide est écarté ;
// - doublons (déjà vus sur 30 jours, ou dans la même veille) rejetés sur l'URL principale ;
// - tri par pertinence, 10 items maximum.
export function selectItems(items: FormattedItem[], researched: ResearchSource[], seenHashes: Set<string>): SelectedItem[] {
  const allowed = new Map<string, ResearchSource>();
  for (const source of researched) {
    const normalized = normalizeUrl(source.url);
    if (normalized && !allowed.has(normalized)) allowed.set(normalized, source);
  }

  const taken = new Set(seenHashes);
  const selected: SelectedItem[] = [];
  for (const item of items) {
    const sources: SelectedSource[] = [];
    for (const url of item.sourceUrls) {
      const normalized = normalizeUrl(url);
      const source = normalized && allowed.get(normalized);
      if (!source || sources.some((s) => normalizeUrl(s.url) === normalized)) continue;
      sources.push({
        url: source.url,
        title: source.title,
        domain: domainOf(source.url),
        publishedAt: source.publishedAt,
        citedText: source.citedText,
      });
    }
    if (sources.length === 0) continue;

    const hash = urlHash(normalizeUrl(sources[0].url)!);
    if (taken.has(hash)) continue;
    taken.add(hash);

    selected.push({
      title: item.title.trim(),
      category: item.category,
      summary: item.summary.trim(),
      whyItMatters: item.whyItMatters.trim(),
      relevance: Math.min(5, Math.max(1, Math.round(item.relevance))),
      urlHash: hash,
      sources: sources.slice(0, 3),
    });
  }

  return selected.sort((a, b) => b.relevance - a.relevance).slice(0, MAX_ITEMS_PER_TOPIC);
}
