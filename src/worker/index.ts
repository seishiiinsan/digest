import { getPrisma } from "@/lib/db";
import { tick } from "./tick";
import { startTicker } from "./ticker";

const prisma = getPrisma();
await prisma.$queryRaw`SELECT 1`;
console.log("[worker] connecté à la base, tick toutes les minutes");

const ticker = startTicker((now) => tick(prisma, now));

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} reçu, arrêt`);
  await ticker.stop();
  await prisma.$disconnect();
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
