import type { JobWithMetadata } from "pg-boss";
import { getPrisma } from "@/lib/db";
import { createBoss, DELIVER_QUEUE, ensureQueue, GENERATE_QUEUE, type DeliverJob, type GenerateJob } from "@/lib/jobs";
import { handleDeliver } from "./deliver";
import { handleGenerate } from "./generate";
import { tick } from "./tick";
import { startTicker } from "./ticker";

const prisma = getPrisma();
await prisma.$queryRaw`SELECT 1`;

const boss = createBoss({ supervise: true });
boss.on("error", (error) => console.error("[pg-boss]", error));
await boss.start();
await ensureQueue(boss);

await boss.work(
  GENERATE_QUEUE,
  { includeMetadata: true, batchSize: 1, localConcurrency: 2, pollingIntervalSeconds: 2 },
  async ([job]: JobWithMetadata<GenerateJob>[]) => handleGenerate({ prisma, boss }, job),
);

await boss.work(
  DELIVER_QUEUE,
  { includeMetadata: true, batchSize: 1, localConcurrency: 2, pollingIntervalSeconds: 2 },
  async ([job]: JobWithMetadata<DeliverJob>[]) => handleDeliver({ prisma }, job),
);

const ticker = startTicker((now) => tick(prisma, boss, now));
console.log("[worker] prêt : génération, livraison et planificateur actifs");

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} reçu, arrêt`);
  await ticker.stop();
  await boss.stop({ graceful: true, timeout: 30_000 });
  await prisma.$disconnect();
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
