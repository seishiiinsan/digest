import type { JobWithMetadata, PgBoss } from "pg-boss";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/db";
import { DELIVER_QUEUE, GENERATE_QUEUE, type DeliverJob, type GenerateJob } from "@/lib/jobs";
import { userData } from "@/lib/user-data";
import type { MessagesClient } from "@/pipeline/research";
import { handleDeliver } from "./deliver";
import { handleGenerate } from "./generate";
import { tick } from "./tick";

const prisma = getPrisma();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
let userId: string;
let otherId: string;

const usage = { input_tokens: 10, output_tokens: 10 };
const claude = {
  messages: {
    create: vi.fn(async () => ({
      stop_reason: "end_turn",
      usage,
      content: [
        {
          type: "text",
          text: "Kubernetes 1.40 publié.",
          citations: [{ type: "web_search_result_location", url: `https://kubernetes.io/blog/${suffix}`, title: "Kubernetes 1.40", cited_text: "released", encrypted_index: "" }],
        },
      ],
    })),
    parse: vi.fn(async () => ({
      stop_reason: "end_turn",
      usage,
      parsed_output: {
        items: [
          {
            title: "Kubernetes 1.40 disponible",
            category: "release",
            summary: "Nouvelle version avec un planificateur plus rapide.",
            whyItMatters: "Mise à jour recommandée pour les clusters en production.",
            relevance: 5,
            sourceUrls: [`https://kubernetes.io/blog/${suffix}`],
          },
        ],
      },
    })),
  },
} as unknown as MessagesClient;

function job<T>(data: T, retryCount = 0) {
  return { data, retryCount, retryLimit: 3 } as JobWithMetadata<T>;
}

beforeAll(async () => {
  userId = (await prisma.user.create({ data: { email: `deliver-${suffix}@digest.test`, emailVerified: true, timezone: "Europe/Paris" } })).id;
  otherId = (await prisma.user.create({ data: { email: `other-${suffix}@digest.test`, emailVerified: true } })).id;
  const data = userData(prisma, userId);
  await data.saveApiKey("sk-ant-api03-delivery-test-key-0000", "claude-sonnet-5");
  await data.createTopic({ title: "DevOps", description: "", keywords: [], includeDomains: [], excludeDomains: [], detailLevel: "standard" });
  await data.saveDelivery("https://discord.com/api/webhooks/42/secret", "discord", "discord.com/api/webhooks/42/…cret");
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherId] } } });
  await prisma.$disconnect();
});

describe("planification et livraison", () => {
  it("à l'heure choisie : génère la veille puis l'envoie sur Discord", async () => {
    await userData(prisma, userId).saveSchedule({ frequency: "daily", weekday: null, hour: 8, paused: false });
    await prisma.schedule.update({ where: { userId }, data: { nextRunAt: new Date(Date.now() - 1000) } });

    const sent: { queue: string; data: unknown }[] = [];
    const boss = { send: vi.fn(async (queue: string, data: object) => (sent.push({ queue, data }), "job")) } as unknown as Pick<PgBoss, "send">;

    await tick(prisma, boss, new Date());
    const generate = sent.find((s) => s.queue === GENERATE_QUEUE)!.data as GenerateJob;

    await handleGenerate({ prisma, boss, createClient: () => claude }, job(generate));
    const deliver = sent.find((s) => s.queue === DELIVER_QUEUE)!.data as DeliverJob;

    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    await handleDeliver({ prisma, fetchImpl, appUrl: "https://digest.test" }, job(deliver));

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://discord.com/api/webhooks/42/secret");
    const body = JSON.parse(String(init.body));
    expect(body.content).toContain(`https://digest.test/veilles/${deliver.digestId}`);
    expect(body.embeds[0]).toMatchObject({ title: "Kubernetes 1.40 disponible", url: `https://kubernetes.io/blog/${suffix}` });
    expect(body.embeds[0].footer.text).toBe("Release · DevOps · kubernetes.io");

    const digest = await prisma.digest.findUniqueOrThrow({ where: { id: deliver.digestId } });
    expect(digest.deliveredAt).not.toBeNull();

    // Déjà livrée : pas de second envoi.
    await handleDeliver({ prisma, fetchImpl }, job(deliver));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("réessaie un webhook indisponible puis enregistre l'erreur", async () => {
    const digest = await prisma.digest.findFirstOrThrow({ where: { userId } });
    await prisma.digest.update({ where: { id: digest.id }, data: { deliveredAt: null } });
    const down = vi.fn(async () => new Response(null, { status: 503 }));

    await expect(handleDeliver({ prisma, fetchImpl: down }, job({ digestId: digest.id }, 0))).rejects.toThrow("indisponible");
    await handleDeliver({ prisma, fetchImpl: down }, job({ digestId: digest.id }, 3));
    expect(await prisma.digest.findUniqueOrThrow({ where: { id: digest.id } })).toMatchObject({
      deliveredAt: null,
      deliveryError: "Discord indisponible (HTTP 503).",
    });
  });
});

describe("fil de lecture", () => {
  it("recherche plein texte, favoris et notes, limités au compte", async () => {
    const mine = userData(prisma, userId);
    const other = userData(prisma, otherId);

    expect((await mine.feed({ query: "planificateur" })).items.map((i) => i.title)).toEqual(["Kubernetes 1.40 disponible"]);
    expect((await mine.feed({ query: "inexistant" })).total).toBe(0);
    expect((await other.feed({ query: "planificateur" })).total).toBe(0);

    const [item] = (await mine.feed({})).items;
    expect((await other.setStarred(item.id, true)).count).toBe(0);
    expect((await other.setFeedback(item.id, "not_useful")).count).toBe(0);

    await mine.setStarred(item.id, true);
    await mine.setFeedback(item.id, "useful");
    expect((await mine.feed({ starred: true })).items[0]).toMatchObject({ id: item.id, starred: true, feedback: "useful" });
  });

  it("transmet les notes du lecteur à la recherche suivante", async () => {
    const boss = { send: vi.fn(async () => "job") };
    const run = await prisma.run.create({ data: { userId, model: "claude-sonnet-5" } });
    await handleGenerate({ prisma, boss, createClient: () => claude }, job({ runId: run.id }));
    const prompt = vi.mocked(claude.messages.create).mock.lastCall![0].messages[0].content as string;
    expect(prompt).toContain("found these past items useful, favor similar news:\n- Kubernetes 1.40 disponible");
  });
});
