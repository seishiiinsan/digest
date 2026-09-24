import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests contre une vraie base : DATABASE_URL et ENCRYPTION_KEY requis (docker compose up -d db).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.int.test.ts"],
    setupFiles: ["dotenv/config"],
    // Les fichiers partagent la base : le tick du planificateur d'un fichier réserverait
    // les plannings échus de l'autre. Exécution séquentielle.
    fileParallelism: false,
  },
});
