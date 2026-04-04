import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    stores: "src/stores/index.ts",
    lib: "src/lib/index.ts",
    types: "src/types/index.ts",
  },
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
