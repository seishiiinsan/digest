import type { PrismaClient } from "@/generated/prisma/client";

// Tick du planificateur : repère les plannings échus.
// La création des jobs de génération (pg-boss) arrive avec le pipeline.
export async function tick(prisma: PrismaClient, now: Date): Promise<void> {
  const due = await prisma.schedule.count({
    where: { paused: false, nextRunAt: { lte: now } },
  });
  if (due > 0) console.log(`[worker] ${due} planning(s) échu(s)`);
}
