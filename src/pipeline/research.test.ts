import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { TopicRefusedError } from "./errors";
import type { TopicBrief } from "./prompts";
import { collect, research, webTools, type MessagesClient } from "./research";

const topic: TopicBrief = {
  title: "Next.js",
  description: "",
  keywords: [],
  includeDomains: [],
  excludeDomains: ["spam.dev"],
  detailLevel: "standard",
};

const searchResult = {
  type: "web_search_tool_result",
  tool_use_id: "s1",
  content: [
    { type: "web_search_result", url: "https://nextjs.org/blog/next-16", title: "Next.js 16", page_age: "2026-09-20", encrypted_content: "" },
    { type: "web_search_result", url: "https://ignored.dev", title: "Non cité", page_age: null, encrypted_content: "" },
  ],
};

const citedText = {
  type: "text",
  text: "Next.js 16 est sorti le 20 septembre.",
  citations: [
    { type: "web_search_result_location", url: "https://nextjs.org/blog/next-16", title: "Next.js 16", cited_text: "Next.js 16 is now stable", encrypted_index: "" },
  ],
};

const fetched = {
  type: "web_fetch_tool_result",
  tool_use_id: "f1",
  content: { type: "web_fetch_result", url: "https://react.dev/blog/x", retrieved_at: null, content: { type: "document", title: "React", source: { type: "text", media_type: "text/plain", data: "" }, citations: null } },
};

function response(content: unknown[], stop_reason: string) {
  return { content, stop_reason, usage: { input_tokens: 100, output_tokens: 50, server_tool_use: { web_search_requests: 1 } } };
}

function fakeClient(...responses: unknown[]) {
  const create = vi.fn();
  for (const r of responses) create.mockResolvedValueOnce(r);
  return { client: { messages: { create } } as unknown as MessagesClient, create };
}

describe("collect", () => {
  it("garde les sources citées ou lues, avec renvois dans les notes", () => {
    const { notes, sources } = collect([searchResult, citedText, fetched] as unknown as Anthropic.ContentBlock[]);
    expect(notes).toBe("Next.js 16 est sorti le 20 septembre. [1]");
    expect(sources).toEqual([
      { url: "https://nextjs.org/blog/next-16", title: "Next.js 16", citedText: "Next.js 16 is now stable", publishedAt: new Date("2026-09-20") },
      { url: "https://react.dev/blog/x", title: "React", citedText: null, publishedAt: null },
    ]);
  });
});

describe("research", () => {
  it("reprend après pause_turn en renvoyant le tour assistant, puis cumule l'usage", async () => {
    const { client, create } = fakeClient(response([searchResult], "pause_turn"), response([citedText], "end_turn"));
    const result = await research(client, "claude-sonnet-5", topic, new Date("2026-09-17"), new Date("2026-09-24"), []);

    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1][0];
    expect(second.messages).toHaveLength(2);
    expect(second.messages[1]).toEqual({ role: "assistant", content: [searchResult] });
    expect(result.sources.map((s) => s.url)).toEqual(["https://nextjs.org/blog/next-16"]);
    expect(result.usage).toMatchObject({ inputTokens: 200, outputTokens: 100, searches: 2 });
  });

  it("signale un refus de Claude", async () => {
    const { client } = fakeClient(response([], "refusal"));
    await expect(research(client, "claude-sonnet-5", topic, new Date(), new Date(), [])).rejects.toBeInstanceOf(TopicRefusedError);
  });

  it("choisit la version des outils selon le modèle et bloque les domaines exclus", () => {
    expect(webTools("claude-sonnet-5", topic)[0]).toMatchObject({ type: "web_search_20260209", blocked_domains: ["spam.dev"], max_uses: 5 });
    expect(webTools("claude-haiku-4-5", topic).map((t) => t.type)).toEqual(["web_search_20250305", "web_fetch_20250910"]);
  });
});

describe("researchPrompt", () => {
  it("transmet les retours du lecteur", async () => {
    const { researchPrompt } = await import("./prompts");
    const prompt = researchPrompt(topic, new Date("2026-09-17"), new Date("2026-09-24"), [], {
      useful: ["Next.js 16 stable"],
      notUseful: ["Levée de fonds de Vercel"],
    });
    expect(prompt).toContain("Period: from 2026-09-17 to 2026-09-24");
    expect(prompt).toContain("found these past items useful, favor similar news:\n- Next.js 16 stable");
    expect(prompt).toContain("not useful, avoid similar news:\n- Levée de fonds de Vercel");
  });
});
