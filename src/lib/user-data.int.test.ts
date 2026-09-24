import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { decrypt } from "@/lib/crypto";
import { getPrisma } from "@/lib/db";
import { userData } from "@/lib/user-data";

const prisma = getPrisma();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let alice: ReturnType<typeof userData>;
let bob: ReturnType<typeof userData>;
let aliceId: string;
let bobId: string;

const topic = { title: "Next.js", description: "", keywords: [], includeDomains: [], excludeDomains: [], detailLevel: "standard" as const };

beforeAll(async () => {
  aliceId = (await prisma.user.create({ data: { email: `alice-${suffix}@digest.test` } })).id;
  bobId = (await prisma.user.create({ data: { email: `bob-${suffix}@digest.test` } })).id;
  alice = userData(prisma, aliceId);
  bob = userData(prisma, bobId);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [aliceId, bobId] } } });
  await prisma.$disconnect();
});

describe("isolation des données entre comptes", () => {
  it("B ne peut ni lire, ni modifier, ni supprimer les thèmes de A", async () => {
    const own = await alice.createTopic(topic);

    expect(await bob.topic(own.id)).toBeNull();
    expect(await bob.topics()).toEqual([]);
    expect((await bob.updateTopic(own.id, { ...topic, title: "piraté" })).count).toBe(0);
    expect((await bob.setTopicActive(own.id, false)).count).toBe(0);
    expect((await bob.deleteTopic(own.id)).count).toBe(0);

    const after = await alice.topic(own.id);
    expect(after).toMatchObject({ title: "Next.js", active: true });
  });

  it("chaque compte ne voit que sa clé et son webhook", async () => {
    await alice.saveApiKey("sk-ant-api03-alice-secret-1234", "claude-sonnet-5");
    await alice.saveDelivery("https://discord.com/api/webhooks/1/alice", "discord", "discord.com/…lice");

    expect(await bob.apiKey()).toBeNull();
    expect(await bob.delivery()).toBeNull();
    await bob.deleteApiKey();
    await bob.deleteDelivery();
    expect(await alice.apiKey()).toMatchObject({ last4: "1234" });
    expect(await alice.delivery()).toMatchObject({ kind: "discord" });
  });

  it("ne stocke la clé API qu'une fois chiffrée", async () => {
    const row = await prisma.apiKey.findUniqueOrThrow({ where: { userId: aliceId } });
    expect(JSON.stringify(row)).not.toContain("alice-secret");
    expect(decrypt(row)).toBe("sk-ant-api03-alice-secret-1234");
  });

  it("supprime tout en cascade avec le compte", async () => {
    await prisma.user.delete({ where: { id: aliceId } });
    expect(await prisma.topic.count({ where: { userId: aliceId } })).toBe(0);
    expect(await prisma.apiKey.count({ where: { userId: aliceId } })).toBe(0);
    expect(await prisma.delivery.count({ where: { userId: aliceId } })).toBe(0);
  });
});
