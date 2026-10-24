import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  server: {
    host: "0.0.0.0",
    port: 3001,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4222",
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            proxyReq.setHeader(
              "x-cloudy-proxy-remote-address",
              req.socket.remoteAddress ?? "",
            );
          });
          proxy.on("proxyReqWs", (proxyReq, req) => {
            proxyReq.setHeader(
              "x-cloudy-proxy-remote-address",
              req.socket.remoteAddress ?? "",
            );
          });
        },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
});
