import Anthropic from "@anthropic-ai/sdk";
import type { JobWithMetadata } from "pg-boss";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/db";
import type { GenerateJob } from "@/lib/jobs";
import { startRun } from "@/lib/runs";
import { userData } from "@/lib/user-data";
import { handleGenerate } from "@/worker/generate";
import { tick } from "@/worker/tick";
import type { MessagesClient } from "./research";
import { runDigest } from "./run";

const prisma = getPrisma();
const boss = { send: vi.fn(async () => "job") };
let userId: string;

const usage = { input_tokens: 1000, output_tokens: 200, server_tool_use: { web_search_requests: 2 } };

// Faux client Claude : une recherche citant une page réelle, puis des items dont un lien inventé.
function fakeClient(slug: string): MessagesClient {
  const url = `https://example.dev/${slug}`;
  return {
    messages: {
      create: vi.fn(async () => ({
        stop_reason: "end_turn",
        usage,
        content: [
          {
            type: "text",
            text: `Nouveauté ${slug}.`,
            citations: [{ type: "web_search_result_location", url, title: `Page ${slug}`, cited_text: "extrait", encrypted_index: "" }],
          },
        ],
      })),
      parse: vi.fn(async () => ({
        stop_reason: "end_turn",
        usage,
        parsed_output: {
          items: [
            { title: `Info ${slug}`, category: "release", summary: "Résumé.", whyItMatters: "Important.", relevance: 4, sourceUrls: [url] },
            { title: "Inventée", category: "article", summary: "x", whyItMatters: "x", relevance: 5, sourceUrls: ["https://fake.dev/nope"] },
          ],
        },
      })),
    },
  } as unknown as MessagesClient;
}

function job(runId: string, retryCount = 0) {
  return { data: { runId }, retryCount, retryLimit: 2 } as JobWithMetadata<GenerateJob>;
}

beforeAll(async () => {
  const user = await prisma.user.create({ data: { email: `pipeline-${Date.now()}@digest.test`, emailVerified: true, locale: "fr" } });
  userId = user.id;
  const data = userData(prisma, userId);
  await data.saveApiKey("sk-ant-api03-pipeline-test-key-0000", "claude-sonnet-5");
  await data.createTopic({ title: "Next.js", description: "", keywords: [], includeDomains: [], excludeDomains: [], detailLevel: "standard" });
  await data.createTopic({ title: "Rust", description: "", keywords: [], includeDomains: [], excludeDomains: [], detailLevel: "short" });
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("pipeline", () => {
  it("génère une veille sourcée pour 2 thèmes, sans lien inventé, avec le coût", async () => {
    const started = await startRun(prisma, boss, userId, "manual");
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(boss.send).toHaveBeenCalledWith("generate-digest", { runId: started.runId }, { singletonKey: started.runId });

    const again = await startRun(prisma, boss, userId, "manual");
    expect(again).toEqual({ ok: false, message: "Une veille est déjà en cours de génération." });

    await runDigest({ prisma, createClient: () => fakeClient("a") }, started.runId);

    const run = await prisma.run.findUniqueOrThrow({ where: { id: started.runId }, include: { digest: { include: { items: { include: { sources: true } } } } } });
    expect(run).toMatchObject({ status: "succeeded", topicsDone: 2, topicsTotal: 2, inputTokens: 4000, outputTokens: 800, searches: 8 });
    // 4 appels Sonnet 5 : 4000 × 2 $ + 800 × 10 $ par M tokens, + 8 recherches
    expect(Number(run.costUsd)).toBeCloseTo(0.008 + 0.008 + 0.08, 4);
    // Même URL pour les 2 thèmes : le doublon intra-veille est écarté.
    expect(run.digest!.items.map((i) => i.title)).toEqual(["Info a"]);
    expect(run.digest!.items[0].sources[0]).toMatchObject({ url: "https://example.dev/a", domain: "example.dev", citedText: "extrait" });
  });

  it("n'inclut pas une info déjà remontée dans une veille précédente", async () => {
    const started = await startRun(prisma, boss, userId, "manual");
    if (!started.ok) throw new Error(started.message);
    await runDigest({ prisma, createClient: () => fakeClient("a") }, started.runId);
    const digest = await prisma.digest.findUniqueOrThrow({ where: { runId: started.runId }, include: { items: true } });
    expect(digest.items).toEqual([]);
  });

  it("réessaie une erreur temporaire puis échoue avec un message lisible", async () => {
    const started = await startRun(prisma, boss, userId, "manual");
    if (!started.ok) throw new Error(started.message);
    const failing = () => {
      const error = Anthropic.APIError.generate(429, { type: "error", error: { type: "rate_limit_error", message: "slow down" } }, "slow down", new Headers());
      return { messages: { create: vi.fn().mockRejectedValue(error), parse: vi.fn() } } as unknown as MessagesClient;
    };

    await expect(handleGenerate({ prisma, createClient: failing }, job(started.runId, 0))).rejects.toThrow();
    expect(await prisma.run.findUniqueOrThrow({ where: { id: started.runId } })).toMatchObject({ status: "queued" });

    await handleGenerate({ prisma, createClient: failing }, job(started.runId, 2));
    expect(await prisma.run.findUniqueOrThrow({ where: { id: started.runId } })).toMatchObject({
      status: "failed",
      error: "Limite de débit atteinte sur cette clé, réessayez dans une minute.",
    });
  });

  it("n'insiste pas sur une clé invalide", async () => {
    const started = await startRun(prisma, boss, userId, "manual");
    if (!started.ok) throw new Error(started.message);
    const unauthorized = () => {
      const error = Anthropic.APIError.generate(401, { type: "error", error: { type: "authentication_error", message: "invalid" } }, "invalid", new Headers());
      return { messages: { create: vi.fn().mockRejectedValue(error), parse: vi.fn() } } as unknown as MessagesClient;
    };
    await handleGenerate({ prisma, createClient: unauthorized }, job(started.runId, 0));
    expect(await prisma.run.findUniqueOrThrow({ where: { id: started.runId } })).toMatchObject({
      status: "failed",
      error: "Clé refusée par Anthropic : elle est invalide ou révoquée.",
    });
  });

  it("le planificateur lance une veille échue une seule fois et avance le planning", async () => {
    await userData(prisma, userId).saveSchedule({ frequency: "daily", weekday: null, hour: 8, paused: false });
    await prisma.schedule.update({ where: { userId }, data: { nextRunAt: new Date(Date.now() - 60_000) } });
    boss.send.mockClear();

    const now = new Date();
    await Promise.all([tick(prisma, boss, now), tick(prisma, boss, now)]);

    expect(boss.send).toHaveBeenCalledTimes(1);
    const schedule = await prisma.schedule.findUniqueOrThrow({ where: { userId } });
    expect(schedule.nextRunAt!.getTime()).toBeGreaterThan(now.getTime());
    expect(await prisma.run.count({ where: { userId, trigger: "scheduled" } })).toBe(1);
  });
});
