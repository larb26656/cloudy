import { defineConfig } from "vitest/config";
import path from "path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const projectResolve = () => ({
  tsconfigPaths: true,
});

export default defineConfig({
  resolve: projectResolve(),
  test: {
    projects: [
      {
        extends: true,
        resolve: projectResolve(),
        test: {
          globals: true,
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        resolve: projectResolve(),
        test: {
          globals: true,
          environment: "jsdom",
          include: ["src/**/*.component.test.tsx"],
          setupFiles: ["./src/test/setup.ts"],
        },
      },
      {
        extends: true,
        resolve: projectResolve(),
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(__dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
