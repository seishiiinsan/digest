import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Client créé à la demande : `next build` importe les routes sans base disponible.
export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquante");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  globalForPrisma.prisma = prisma;
  return prisma;
}
