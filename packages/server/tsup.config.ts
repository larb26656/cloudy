import { defineConfig } from "tsup";
import { cp, mkdir } from "node:fs/promises";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  async onSuccess() {
    await mkdir("./dist/drizzle", { recursive: true });

    await cp("./drizzle", "./dist/drizzle", {
      recursive: true,
      force: true,
    });
  },
});
