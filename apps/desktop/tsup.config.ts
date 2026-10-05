import { defineConfig } from "tsup";
import { cp, mkdir } from "node:fs/promises";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "node20",
  platform: "node",
  banner: {
    js: `import { createRequire } from "module";
const require = createRequire(import.meta.url);`,
  },
  external: ["electron", "better-sqlite3", "@lydell/node-pty"],
  async onSuccess() {
    await mkdir("./dist/drizzle", { recursive: true });

    await cp("../../packages/server/drizzle", "./dist/drizzle", {
      recursive: true,
      force: true,
    });
  },
});
