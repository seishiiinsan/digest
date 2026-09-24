import type { PrismaClient } from "@/generated/prisma/client";

export interface RateLimitRule {
  max: number;
  windowMs: number;
}

export interface RateLimitRecord {
  count: number;
  windowStart: number;
}

// Fenêtre fixe : `windowStart` marque le début de la fenêtre courante.
export function consume(
  record: RateLimitRecord | null,
  rule: RateLimitRule,
  now: number,
): { allowed: boolean; record: RateLimitRecord } {
  if (!record || now - record.windowStart >= rule.windowMs) {
    return { allowed: true, record: { count: 1, windowStart: now } };
  }
  if (record.count >= rule.max) return { allowed: false, record };
  return { allowed: true, record: { count: record.count + 1, windowStart: record.windowStart } };
}

// Compteur en base, partagé avec la limite par IP de Better Auth (clés préfixées).
export async function hit(prisma: PrismaClient, key: string, rule: RateLimitRule, now = Date.now()): Promise<boolean> {
  const row = await prisma.rateLimit.findUnique({ where: { key } });
  const current = row ? { count: row.count, windowStart: Number(row.lastRequest) } : null;
  const { allowed, record } = consume(current, rule, now);
  if (allowed) {
    const data = { count: record.count, lastRequest: BigInt(record.windowStart) };
    await prisma.rateLimit.upsert({ where: { key }, create: { key, ...data }, update: data });
  }
  return allowed;
}
