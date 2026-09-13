import { config } from "@repo/eslint-config/react-internal";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  ...config,
  reactRefresh.configs.vite,
  { ignores: ["dist/**"] },
  {
    rules: {
      "react/prop-types": "off",
    },
  },
];
