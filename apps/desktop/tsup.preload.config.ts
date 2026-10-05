import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/preload.ts"],
  format: ["cjs"],
  splitting: false,
  sourcemap: true,
  clean: false,
  target: "node20",
  platform: "node",
  external: ["electron"],
  outDir: "dist",
  outExtension: () => ({ js: ".cjs" }),
});
