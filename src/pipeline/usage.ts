import { CACHE_READ_MULTIPLIER, CACHE_WRITE_MULTIPLIER, modelPricing, WEB_SEARCH_USD } from "@/lib/models";

export interface UsageTotals {
  inputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  searches: number;
}

export const emptyUsage = (): UsageTotals => ({
  inputTokens: 0,
  cacheWriteTokens: 0,
  cacheReadTokens: 0,
  outputTokens: 0,
  searches: 0,
});

// Forme minimale de `usage` renvoyé par l'API Messages.
export interface ApiUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  server_tool_use?: { web_search_requests: number } | null;
}

export function addUsage(total: UsageTotals, usage: ApiUsage): UsageTotals {
  return {
    inputTokens: total.inputTokens + usage.input_tokens,
    cacheWriteTokens: total.cacheWriteTokens + (usage.cache_creation_input_tokens ?? 0),
    cacheReadTokens: total.cacheReadTokens + (usage.cache_read_input_tokens ?? 0),
    outputTokens: total.outputTokens + usage.output_tokens,
    searches: total.searches + (usage.server_tool_use?.web_search_requests ?? 0),
  };
}

export function sumUsage(a: UsageTotals, b: UsageTotals): UsageTotals {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    searches: a.searches + b.searches,
  };
}

export function costUsd(model: string, usage: UsageTotals): number {
  const { input, output } = modelPricing(model);
  const tokens =
    usage.inputTokens * input +
    usage.cacheWriteTokens * input * CACHE_WRITE_MULTIPLIER +
    usage.cacheReadTokens * input * CACHE_READ_MULTIPLIER +
    usage.outputTokens * output;
  return tokens / 1_000_000 + usage.searches * WEB_SEARCH_USD;
}
