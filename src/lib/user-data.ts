import type { Feedback, PrismaClient } from "@/generated/prisma/client";
import { decrypt, encrypt } from "@/lib/crypto";
import type { ScheduleRule } from "@/lib/schedule";
import { nextRunAt } from "@/lib/schedule";
import type { WebhookKind } from "@/lib/webhook";

// Accès aux données d'un compte. Chaque requête filtre sur userId :
// les écritures ciblées passent par updateMany/deleteMany avec { id, userId }, jamais par l'id seul.
export interface TopicInput {
  title: string;
  description: string;
  keywords: string[];
  includeDomains: string[];
  excludeDomains: string[];
  detailLevel: "short" | "standard" | "detailed";
}

export interface FeedFilters {
  query?: string;
  starred?: boolean;
  topicId?: string;
  take?: number;
}

const itemInclude = {
  sources: true,
  topic: { select: { title: true } },
  digest: { select: { id: true, createdAt: true } },
} as const;

export function userData(prisma: PrismaClient, userId: string) {
  return {
    profile: () => prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    apiKey: () => prisma.apiKey.findUnique({ where: { userId }, select: { last4: true, model: true, validatedAt: true } }),
    schedule: () => prisma.schedule.findUnique({ where: { userId } }),
    delivery: () => prisma.delivery.findUnique({ where: { userId }, select: { kind: true, hint: true, active: true } }),

    updatePreferences: (data: { locale: string; timezone: string }) =>
      prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: userId }, data });
        const schedule = await tx.schedule.findUnique({ where: { userId } });
        if (schedule) {
          await tx.schedule.update({
            where: { userId },
            data: { nextRunAt: nextRunAt(schedule, data.timezone, new Date()) },
          });
        }
      }),

    saveApiKey: (apiKey: string, model: string) => {
      const data = { ...encrypt(apiKey), last4: apiKey.slice(-4), model, validatedAt: new Date() };
      return prisma.apiKey.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    },
    setModel: (model: string) => prisma.apiKey.updateMany({ where: { userId }, data: { model } }),
    deleteApiKey: () => prisma.apiKey.deleteMany({ where: { userId } }),

    saveSchedule: async (rule: ScheduleRule & { paused: boolean }) => {
      const { timezone } = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
      const data = { ...rule, nextRunAt: nextRunAt(rule, timezone, new Date()) };
      return prisma.schedule.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    },

    saveDelivery: (url: string, kind: WebhookKind, hint: string) => {
      const encrypted = encrypt(url);
      const data = { kind, hint, active: true, urlCiphertext: encrypted.ciphertext, urlIv: encrypted.iv, urlAuthTag: encrypted.authTag };
      return prisma.delivery.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    },
    deleteDelivery: () => prisma.delivery.deleteMany({ where: { userId } }),
    // URL déchiffrée : uniquement côté serveur, jamais renvoyée au navigateur.
    deliveryTarget: async () => {
      const row = await prisma.delivery.findUnique({ where: { userId } });
      if (!row) return null;
      return { kind: row.kind, url: decrypt({ ciphertext: row.urlCiphertext, iv: row.urlIv, authTag: row.urlAuthTag }) };
    },

    topics: () => prisma.topic.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    topic: (id: string) => prisma.topic.findFirst({ where: { id, userId } }),
    createTopic: (data: TopicInput) => prisma.topic.create({ data: { ...data, userId } }),
    updateTopic: (id: string, data: TopicInput) => prisma.topic.updateMany({ where: { id, userId }, data }),
    setTopicActive: (id: string, active: boolean) => prisma.topic.updateMany({ where: { id, userId }, data: { active } }),
    deleteTopic: (id: string) => prisma.topic.deleteMany({ where: { id, userId } }),

    runs: (take = 50) =>
      prisma.run.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take, include: { digest: { select: { id: true } } } }),
    run: (id: string) => prisma.run.findFirst({ where: { id, userId }, include: { digest: { select: { id: true } } } }),
    activeRun: () => prisma.run.findFirst({ where: { userId, status: { in: ["queued", "running"] } } }),

    // Fil de lecture : infos de toutes les veilles, les plus récentes d'abord.
    feed: async ({ query, starred, topicId, take = 30 }: FeedFilters) => {
      let ids: string[] | undefined;
      if (query?.trim()) {
        // Même expression que l'index GIN de la migration « lecture ».
        const rows = await prisma.$queryRaw<{ id: string }[]>`
          SELECT i.id FROM "Item" i JOIN "Digest" d ON d.id = i."digestId"
          WHERE d."userId" = ${userId}
            AND to_tsvector('simple', i."title" || ' ' || i."summary" || ' ' || i."whyItMatters") @@ websearch_to_tsquery('simple', ${query.trim()})
          ORDER BY d."createdAt" DESC
          LIMIT 500`;
        ids = rows.map((row) => row.id);
      }
      const where = {
        digest: { userId },
        ...(ids && { id: { in: ids } }),
        ...(starred && { starred: true }),
        ...(topicId && { topicId }),
      };
      const [items, total] = await Promise.all([
        prisma.item.findMany({
          where,
          orderBy: [{ digest: { createdAt: "desc" } }, { relevance: "desc" }, { createdAt: "asc" }],
          take,
          include: itemInclude,
        }),
        prisma.item.count({ where }),
      ]);
      return { items, total };
    },
    setStarred: (itemId: string, starred: boolean) =>
      prisma.item.updateMany({ where: { id: itemId, digest: { userId } }, data: { starred } }),
    setFeedback: (itemId: string, feedback: Feedback | null) =>
      prisma.item.updateMany({ where: { id: itemId, digest: { userId } }, data: { feedback } }),

    digests: (take = 30) =>
      prisma.digest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take,
        include: { _count: { select: { items: true } } },
      }),
    digest: (id: string) =>
      prisma.digest.findFirst({
        where: { id, userId },
        include: {
          run: { select: { costUsd: true, model: true, error: true } },
          items: {
            orderBy: [{ relevance: "desc" }, { createdAt: "asc" }],
            include: itemInclude,
          },
        },
      }),
  };
}

export type UserData = ReturnType<typeof userData>;
