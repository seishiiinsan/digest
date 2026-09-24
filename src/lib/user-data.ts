import type { PrismaClient } from "@/generated/prisma/client";
import { encrypt } from "@/lib/crypto";
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

    topics: () => prisma.topic.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    topic: (id: string) => prisma.topic.findFirst({ where: { id, userId } }),
    createTopic: (data: TopicInput) => prisma.topic.create({ data: { ...data, userId } }),
    updateTopic: (id: string, data: TopicInput) => prisma.topic.updateMany({ where: { id, userId }, data }),
    setTopicActive: (id: string, active: boolean) => prisma.topic.updateMany({ where: { id, userId }, data: { active } }),
    deleteTopic: (id: string) => prisma.topic.deleteMany({ where: { id, userId } }),
  };
}

export type UserData = ReturnType<typeof userData>;
