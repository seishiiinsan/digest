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
  },
});
