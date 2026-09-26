import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "Cloudy",
    short_name: "Cloudy",
    description: "Chat with Cloudy from your browser.",
    permissions: ["sidePanel", "storage"],
    host_permissions: ["http://localhost:5122/*", "http://localhost:4122/*"],
    action: {
      default_title: "Cloudy",
    },
    browser_specific_settings: {
      gecko: {
        id: "larb26656@gmail.com",
        data_collection_permissions: {
          required: ["websiteContent"],
        },
        strict_min_version: "109.0",
      },
    },
  },
});
