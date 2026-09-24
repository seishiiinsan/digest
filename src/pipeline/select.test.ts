import { describe, expect, it } from "vitest";
import type { FormattedItem } from "./format";
import type { ResearchSource } from "./research";
import { selectItems } from "./select";
import { normalizeUrl, urlHash } from "./urls";

const researched: ResearchSource[] = [
  { url: "https://nextjs.org/blog/next-16", title: "Next.js 16", citedText: "Next.js 16 is out", publishedAt: null },
  { url: "https://react.dev/blog/react-20", title: "React 20", citedText: null, publishedAt: new Date("2026-09-20") },
  { url: "https://vercel.com/changelog/x", title: "Changelog", citedText: null, publishedAt: null },
];

function item(overrides: Partial<FormattedItem>): FormattedItem {
  return {
    title: "Titre",
    category: "release",
    summary: "Résumé.",
    whyItMatters: "Important.",
    relevance: 3,
    sourceUrls: ["https://nextjs.org/blog/next-16"],
    ...overrides,
  };
}

describe("selectItems", () => {
  it("écarte les URL inventées et les items sans source réelle", () => {
    const result = selectItems(
      [
        item({ title: "Inventé", sourceUrls: ["https://nextjs.org/blog/next-17"] }),
        item({ title: "Mixte", sourceUrls: ["https://fake.dev/x", "http://www.nextjs.org/blog/next-16/?utm_source=a"] }),
      ],
      researched,
      new Set(),
    );
    expect(result.map((i) => i.title)).toEqual(["Mixte"]);
    expect(result[0].sources).toEqual([
      { url: "https://nextjs.org/blog/next-16", title: "Next.js 16", domain: "nextjs.org", publishedAt: null, citedText: "Next.js 16 is out" },
    ]);
  });

  it("rejette les doublons des veilles précédentes et de la même veille", () => {
    const seen = new Set([urlHash(normalizeUrl("https://react.dev/blog/react-20")!)]);
    const result = selectItems(
      [
        item({ title: "Déjà vu", sourceUrls: ["https://react.dev/blog/react-20"] }),
        item({ title: "Nouveau", sourceUrls: ["https://nextjs.org/blog/next-16"] }),
        item({ title: "Doublon", sourceUrls: ["https://nextjs.org/blog/next-16"] }),
      ],
      researched,
      seen,
    );
    expect(result.map((i) => i.title)).toEqual(["Nouveau"]);
  });

  it("trie par pertinence, borne la note et limite à 10", () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      item({ title: `#${i}`, relevance: i % 7, sourceUrls: [`https://vercel.com/changelog/x?id=${i}`] }),
    );
    const sources = many.map((m) => ({ url: m.sourceUrls[0], title: m.title, citedText: null, publishedAt: null }));
    const result = selectItems(many, sources, new Set());
    expect(result).toHaveLength(10);
    expect(result[0].relevance).toBe(5);
    expect(result.at(-1)!.relevance).toBeGreaterThanOrEqual(1);
    expect(result.every((r, i) => i === 0 || result[i - 1].relevance >= r.relevance)).toBe(true);
  });
});
