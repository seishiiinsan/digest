import Anthropic from "@anthropic-ai/sdk";
import type { PrismaClient } from "@/generated/prisma/client";
import { decrypt } from "@/lib/crypto";
import { PipelineError, TopicRefusedError } from "./errors";
import { format } from "./format";
import type { TopicBrief } from "./prompts";
import { research, type MessagesClient } from "./research";
import { selectItems, type SelectedItem } from "./select";
import { costUsd, sumUsage } from "./usage";

const DAY = 24 * 60 * 60 * 1000;
const DEDUP_WINDOW = 30 * DAY;
const MAX_KNOWN_URLS = 50;
const FEEDBACK_WINDOW = 90 * DAY;
const MAX_FEEDBACK = 10;

export interface PipelineDeps {
  prisma: PrismaClient;
  createClient?: (apiKey: string) => MessagesClient;
  now?: () => Date;
}

const defaultClient = (apiKey: string): MessagesClient => new Anthropic({ apiKey, maxRetries: 2, timeout: 10 * 60 * 1000 });

// Exécute un run : recherche + mise en forme par thème, dédoublonnage, sauvegarde de la veille.
export async function runDigest({ prisma, createClient = defaultClient, now = () => new Date() }: PipelineDeps, runId: string) {
  const run = await prisma.run.findUniqueOrThrow({
    where: { id: runId },
    include: { user: { include: { apiKey: true, schedule: true } } },
  });
  if (run.status === "succeeded" || run.status === "failed") return;
  const { user } = run;
  if (!user.apiKey) throw new PipelineError("Aucune clé API enregistrée.", false);

  const topics = await prisma.topic.findMany({ where: { userId: user.id, active: true }, orderBy: { createdAt: "asc" } });
  if (topics.length === 0) throw new PipelineError("Aucun thème actif.", false);

  const startedAt = now();
  const model = user.apiKey.model;
  const client = createClient(decrypt(user.apiKey));

  // Période : depuis la dernière veille réussie, au moins 1 jour, au plus 30.
  const lastSuccess = await prisma.run.findFirst({
    where: { userId: user.id, status: "succeeded", id: { not: runId } },
    orderBy: { finishedAt: "desc" },
    select: { finishedAt: true },
  });
  const defaultSpan = user.schedule?.frequency === "weekly" ? 7 * DAY : DAY;
  const since = new Date(
    Math.max(
      startedAt.getTime() - DEDUP_WINDOW,
      Math.min(lastSuccess?.finishedAt?.getTime() ?? startedAt.getTime() - defaultSpan, startedAt.getTime() - DAY),
    ),
  );

  const recent = await prisma.item.findMany({
    where: { digest: { userId: user.id }, createdAt: { gte: new Date(startedAt.getTime() - DEDUP_WINDOW) } },
    orderBy: { createdAt: "desc" },
    select: { urlHash: true, sources: { select: { url: true }, take: 1 } },
  });
  const seenHashes = new Set(recent.map((item) => item.urlHash));
  const knownUrls = recent.flatMap((item) => item.sources.map((s) => s.url)).slice(0, MAX_KNOWN_URLS);

  await prisma.run.update({
    where: { id: runId },
    data: { status: "running", startedAt, model, topicsTotal: topics.length, topicsDone: 0, error: null },
  });

  const selected: { topicId: string; item: SelectedItem }[] = [];
  const refused: string[] = [];

  for (const topic of topics) {
    const brief: TopicBrief = topic;
    let usage;
    try {
      const rated = await prisma.item.findMany({
        where: { topicId: topic.id, feedback: { not: null }, createdAt: { gte: new Date(startedAt.getTime() - FEEDBACK_WINDOW) } },
        orderBy: { createdAt: "desc" },
        select: { title: true, feedback: true },
        take: 2 * MAX_FEEDBACK,
      });
      const feedback = {
        useful: rated.filter((i) => i.feedback === "useful").map((i) => i.title).slice(0, MAX_FEEDBACK),
        notUseful: rated.filter((i) => i.feedback === "not_useful").map((i) => i.title).slice(0, MAX_FEEDBACK),
      };
      const found = await research(client, model, brief, since, startedAt, knownUrls, feedback);
      const formatted = await format(client, model, brief, user.locale, found.notes, found.sources);
      usage = sumUsage(found.usage, formatted.usage);
      for (const item of selectItems(formatted.items, found.sources, seenHashes)) {
        seenHashes.add(item.urlHash);
        selected.push({ topicId: topic.id, item });
      }
    } catch (error) {
      if (!(error instanceof TopicRefusedError)) throw error;
      refused.push(error.message);
    }

    await prisma.run.update({
      where: { id: runId },
      data: {
        topicsDone: { increment: 1 },
        ...(usage && {
          inputTokens: { increment: usage.inputTokens },
          cacheWriteTokens: { increment: usage.cacheWriteTokens },
          cacheReadTokens: { increment: usage.cacheReadTokens },
          outputTokens: { increment: usage.outputTokens },
          searches: { increment: usage.searches },
          costUsd: { increment: costUsd(model, usage) },
        }),
      },
    });
  }

  if (refused.length === topics.length) throw new PipelineError(refused.join(" "), false);

  await prisma.$transaction([
    prisma.digest.create({
      data: {
        runId,
        userId: user.id,
        language: user.locale,
        items: {
          create: selected.map(({ topicId, item: { sources, ...item } }) => ({
            ...item,
            topicId,
            sources: { create: sources },
          })),
        },
      },
    }),
    prisma.run.update({
      where: { id: runId },
      data: { status: "succeeded", finishedAt: now(), error: refused.length > 0 ? refused.join(" ") : null },
    }),
  ]);
}

export async function markRunFailed(prisma: PrismaClient, runId: string, message: string, final: boolean) {
  await prisma.run.update({
    where: { id: runId },
    data: final
      ? { status: "failed", finishedAt: new Date(), error: message }
      : { status: "queued", error: `${message} Nouvelle tentative programmée.` },
  });
}
