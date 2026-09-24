import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // `prisma generate` n'a pas besoin de base : l'URL n'est requise que pour migrate.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
