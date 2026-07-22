// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { config } from "@repo/eslint-config/react-internal";
import reactRefresh from "eslint-plugin-react-refresh";

export default [...config, reactRefresh.configs.vite, {
  ignores: ["dist/**", ".tanstack/**", "src/routeTree.gen.ts", "storybook-static/**"],
}, {
  rules: {
    "react-refresh/only-export-components": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      },
    ],
  },
}, {
  files: ["**/*.stories.tsx", "**/*.stories.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "react-hooks/rules-of-hooks": "off",
  },
}, ...storybook.configs["flat/recommended"]];
