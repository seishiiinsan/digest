import { build } from "esbuild";

// Bundle autonome du worker : l'image Docker n'embarque ni node_modules ni sources.
await build({
  entryPoints: ["src/worker/index.ts"],
  outfile: "dist/worker.mjs",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: true,
  // pg charge pg-native en option ; require() est absent des modules ESM.
  external: ["pg-native"],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  logLevel: "info",
});
