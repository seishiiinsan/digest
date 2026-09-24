import type { PgBoss } from "pg-boss";
import type { PrismaClient } from "@/generated/prisma/client";
import { startRun } from "@/lib/runs";
import { nextRunAt } from "@/lib/schedule";

// Tick du planificateur : lance une veille pour chaque planning échu, puis avance nextRunAt.
export async function tick(prisma: PrismaClient, boss: Pick<PgBoss, "send">, now: Date): Promise<void> {
  const due = await prisma.schedule.findMany({
    where: { paused: false, nextRunAt: { lte: now } },
    include: { user: { select: { timezone: true } } },
    take: 100,
  });

  for (const schedule of due) {
    // Réservation atomique : si un autre tick a déjà avancé nextRunAt, on ne fait rien.
    const { count } = await prisma.schedule.updateMany({
      where: { id: schedule.id, nextRunAt: schedule.nextRunAt },
      data: { nextRunAt: nextRunAt(schedule, schedule.user.timezone, now) },
    });
    if (count === 0) continue;

    const result = await startRun(prisma, boss, schedule.userId, "scheduled");
    console.log(
      result.ok
        ? `[worker] veille planifiée ${result.runId} pour ${schedule.userId}`
        : `[worker] veille planifiée ignorée pour ${schedule.userId} : ${result.message}`,
    );
  }
}
