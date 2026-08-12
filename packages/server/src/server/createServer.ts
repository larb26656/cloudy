import { serve, type ServerType } from "@hono/node-server";
import { WebSocketServer } from "ws";
import { createApp } from "../server";
import { createContainer } from "../container";
import { AppOption, loadConfig } from "../config/config";

export function createServer(option: AppOption) {
  let server: ServerType | null = null;

  const start = async () => {
    const config = loadConfig(option);
    const container = createContainer(config);

    const app = createApp({
      corsOrigins: config.cors,
      enableUI: config.ui,
      publicDir: config.publicDir,
      container,
    });

    const webSocketServer = new WebSocketServer({ noServer: true });

    server = serve({
      fetch: app.fetch,
      port: config.port,
      hostname: config.host,
      websocket: { server: webSocketServer },
    });

    const url = `http://${config.host}:${config.port}`;
    return { url };
  };

  const stop = async () => {
    server?.close();
    server = null;
  };

  return { start, stop };
}
