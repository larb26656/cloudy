import { defineConfig, defineProject } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    projects: [
      defineProject({
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.integration.test.ts", "node_modules", "dist"],
        },
      }),
      defineProject({
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.ts"],
        },
      }),
    ],
  },
});
