import type Anthropic from "@anthropic-ai/sdk";
import { supportsDynamicWebTools } from "@/lib/models";
import { TopicRefusedError } from "./errors";
import { RESEARCH_SYSTEM, researchPrompt, type ReaderFeedback, type TopicBrief } from "./prompts";
import { addUsage, emptyUsage, type UsageTotals } from "./usage";

export type MessagesClient = Pick<Anthropic, "messages">;

export interface ResearchSource {
  url: string;
  title: string;
  citedText: string | null;
  publishedAt: Date | null;
}

export interface ResearchResult {
  notes: string;
  // Seules ces URL (citées ou lues) pourront apparaître dans la veille.
  sources: ResearchSource[];
  usage: UsageTotals;
}

const MAX_CONTINUATIONS = 4;

export function webTools(model: string, topic: TopicBrief) {
  const blocked = topic.excludeDomains.length > 0 ? { blocked_domains: topic.excludeDomains } : {};
  if (supportsDynamicWebTools(model)) {
    return [
      { type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 5, ...blocked },
      { type: "web_fetch_20260209" as const, name: "web_fetch" as const, max_uses: 5, ...blocked },
    ];
  }
  return [
    { type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 5, ...blocked },
    { type: "web_fetch_20250910" as const, name: "web_fetch" as const, max_uses: 5, ...blocked },
  ];
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Lit les blocs de réponse : notes (texte + renvois [n]) et sources réellement utilisées.
export function collect(content: Anthropic.ContentBlock[]): { notes: string; sources: ResearchSource[] } {
  const seen = new Map<string, { title: string; publishedAt: Date | null }>();
  const kept = new Map<string, ResearchSource>();
  const keep = (url: string, title: string | null, citedText: string | null) => {
    const existing = kept.get(url);
    if (existing) {
      existing.citedText ??= citedText;
      return;
    }
    const meta = seen.get(url);
    kept.set(url, { url, title: title || meta?.title || url, citedText, publishedAt: meta?.publishedAt ?? null });
  };
  const index = (url: string) => [...kept.keys()].indexOf(url) + 1;

  let notes = "";
  for (const block of content) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const result of block.content) {
        seen.set(result.url, { title: result.title, publishedAt: parseDate(result.page_age) });
      }
    } else if (block.type === "web_fetch_tool_result" && block.content.type === "web_fetch_result") {
      const { url, content: document } = block.content;
      keep(url, document.title ?? null, null);
    } else if (block.type === "text") {
      notes += block.text;
      const refs = new Set<number>();
      for (const citation of block.citations ?? []) {
        if (citation.type !== "web_search_result_location") continue;
        keep(citation.url, citation.title, citation.cited_text);
        refs.add(index(citation.url));
      }
      if (refs.size > 0) notes += ` [${[...refs].join("][")}]`;
    }
  }
  return { notes: notes.trim(), sources: [...kept.values()] };
}

export async function research(
  client: MessagesClient,
  model: string,
  topic: TopicBrief,
  since: Date,
  now: Date,
  knownUrls: string[],
  feedback?: ReaderFeedback,
): Promise<ResearchResult> {
  const prompt = researchPrompt(topic, since, now, knownUrls, feedback);
  const assistantContent: Anthropic.ContentBlock[] = [];
  let usage = emptyUsage();

  for (let attempt = 0; attempt <= MAX_CONTINUATIONS; attempt++) {
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
    // Reprise après pause_turn : on renvoie le tour assistant tel quel, sans message « continue ».
    if (assistantContent.length > 0) messages.push({ role: "assistant", content: [...assistantContent] });

    const response = await client.messages.create({
      model,
      max_tokens: 16_000,
      system: [{ type: "text", text: RESEARCH_SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: webTools(model, topic),
      messages,
    });
    usage = addUsage(usage, response.usage);
    assistantContent.push(...response.content);

    if (response.stop_reason === "refusal") throw new TopicRefusedError(topic.title);
    if (response.stop_reason !== "pause_turn") break;
  }

  return { ...collect(assistantContent), usage };
}
