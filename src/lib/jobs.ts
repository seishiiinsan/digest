import { PgBoss } from "pg-boss";

export const GENERATE_QUEUE = "generate-digest";

export interface GenerateJob {
  runId: string;
}

// Deux reprises maximum, avec délai croissant (30 s puis ~60 s).
export const GENERATE_QUEUE_OPTIONS = {
  retryLimit: 2,
  retryDelay: 30,
  retryBackoff: true,
  expireInSeconds: 30 * 60,
};

export const DELIVER_QUEUE = "deliver-digest";

export interface DeliverJob {
  digestId: string;
}

export const DELIVER_QUEUE_OPTIONS = {
  retryLimit: 3,
  retryDelay: 60,
  retryBackoff: true,
  expireInSeconds: 5 * 60,
};

export function createBoss(options: { supervise: boolean }): PgBoss {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquante");
  return new PgBoss({ connectionString, supervise: options.supervise, schedule: false });
}

export async function ensureQueue(boss: PgBoss): Promise<void> {
  if (!(await boss.getQueue(GENERATE_QUEUE))) await boss.createQueue(GENERATE_QUEUE, GENERATE_QUEUE_OPTIONS);
  if (!(await boss.getQueue(DELIVER_QUEUE))) await boss.createQueue(DELIVER_QUEUE, DELIVER_QUEUE_OPTIONS);
}

const globalForBoss = globalThis as unknown as { boss?: Promise<PgBoss> };

// Côté web : client pg-boss qui ne fait qu'envoyer des jobs (pas de maintenance, le worker s'en charge).
export function getSenderBoss(): Promise<PgBoss> {
  globalForBoss.boss ??= (async () => {
    const boss = createBoss({ supervise: false });
    boss.on("error", (error) => console.error("[pg-boss]", error));
    await boss.start();
    await ensureQueue(boss);
    return boss;
  })();
  return globalForBoss.boss;
}
