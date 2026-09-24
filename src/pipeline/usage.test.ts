import { describe, expect, it } from "vitest";
import { addUsage, costUsd, emptyUsage } from "./usage";

describe("usage et coût", () => {
  it("cumule les usages de plusieurs appels", () => {
    let total = emptyUsage();
    total = addUsage(total, { input_tokens: 1000, output_tokens: 200, server_tool_use: { web_search_requests: 3 } });
    total = addUsage(total, { input_tokens: 500, output_tokens: 100, cache_read_input_tokens: 2000, cache_creation_input_tokens: 400 });
    expect(total).toEqual({ inputTokens: 1500, cacheWriteTokens: 400, cacheReadTokens: 2000, outputTokens: 300, searches: 3 });
  });

  it("calcule le coût Sonnet 5 avec cache et recherches", () => {
    const usage = { inputTokens: 1_000_000, cacheWriteTokens: 0, cacheReadTokens: 1_000_000, outputTokens: 100_000, searches: 5 };
    // 2 $ + 0,2 $ (cache lu) + 1 $ (sortie) + 0,05 $ (recherches)
    expect(costUsd("claude-sonnet-5", usage)).toBeCloseTo(3.25, 6);
  });
});
