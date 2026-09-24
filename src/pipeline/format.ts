import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { TopicRefusedError } from "./errors";
import { FORMAT_SYSTEM, formatPrompt, type TopicBrief } from "./prompts";
import type { MessagesClient, ResearchSource } from "./research";
import { addUsage, emptyUsage, type UsageTotals } from "./usage";

const CATEGORIES = ["release", "announcement", "article", "security", "trend"] as const;

export const formattedItemsSchema = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      category: z.enum(CATEGORIES),
      summary: z.string(),
      whyItMatters: z.string(),
      relevance: z.number().int(),
      sourceUrls: z.array(z.string()),
    }),
  ),
});

export type FormattedItem = z.infer<typeof formattedItemsSchema>["items"][number];

export interface FormatResult {
  items: FormattedItem[];
  usage: UsageTotals;
}

// Deuxième appel, sans outils : notes → items structurés dans la langue cible.
export async function format(
  client: MessagesClient,
  model: string,
  topic: TopicBrief,
  language: string,
  notes: string,
  sources: ResearchSource[],
): Promise<FormatResult> {
  if (sources.length === 0 || !notes) return { items: [], usage: emptyUsage() };

  const response = await client.messages.parse({
    model,
    max_tokens: 16_000,
    system: [{ type: "text", text: FORMAT_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: formatPrompt(topic, language, notes, sources) }],
    output_config: { format: zodOutputFormat(formattedItemsSchema) },
  });
  const usage = addUsage(emptyUsage(), response.usage);
  if (response.stop_reason === "refusal") throw new TopicRefusedError(topic.title);
  return { items: response.parsed_output?.items ?? [], usage };
}
