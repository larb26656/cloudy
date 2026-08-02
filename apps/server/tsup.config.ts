import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "node20",
  platform: "node",
  banner: {
    js: `#!/usr/bin/env node
import { createRequire } from "module";
const require = createRequire(import.meta.url);`,
  },
  external: ["better-sqlite3", "@lydell/node-pty"],
});
