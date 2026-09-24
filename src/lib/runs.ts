import type { PgBoss } from "pg-boss";
import type { PrismaClient, RunTrigger } from "@/generated/prisma/client";
import { GENERATE_QUEUE, type GenerateJob } from "@/lib/jobs";

export type StartRunResult = { ok: true; runId: string } | { ok: false; message: string };

// Crée un run et le confie au worker. Le web n'appelle jamais Claude lui-même.
export async function startRun(
  prisma: PrismaClient,
  boss: Pick<PgBoss, "send">,
  userId: string,
  trigger: RunTrigger,
): Promise<StartRunResult> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      emailVerified: true,
      apiKey: { select: { model: true } },
      _count: { select: { topics: { where: { active: true } } } },
    },
  });
  if (!user.emailVerified) return { ok: false, message: "Vérifiez votre adresse email avant votre première veille." };
  if (!user.apiKey) return { ok: false, message: "Ajoutez votre clé API Anthropic dans les réglages." };
  if (user._count.topics === 0) return { ok: false, message: "Activez au moins une rubrique." };

  const pending = await prisma.run.findFirst({ where: { userId, status: { in: ["queued", "running"] } } });
  if (pending) return { ok: false, message: "Une veille est déjà en cours de génération." };

  const run = await prisma.run.create({
    data: { userId, trigger, model: user.apiKey.model, topicsTotal: user._count.topics },
  });
  await boss.send(GENERATE_QUEUE, { runId: run.id } satisfies GenerateJob, { singletonKey: run.id });
  return { ok: true, runId: run.id };
}
