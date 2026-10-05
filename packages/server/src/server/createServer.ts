import { serve, type ServerType } from "@hono/node-server";
import { WebSocketServer } from "ws";
import { createApp } from "../server";
import { createContainer } from "../container";
import { AppOption, loadConfig, resolveConfigDir } from "../config/config";
import type { Container } from "../container";

export function createServer(option: AppOption) {
  let server: ServerType | null = null;
  let container: Container | null = null;

  const start = async () => {
    const config = loadConfig(option);
    container = createContainer(config, undefined, resolveConfigDir(option));
    container.providerEventHub.start();

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

    if (!server.listening) {
      await new Promise<void>((resolve, reject) => {
        server?.once("listening", () => resolve());
        server?.once("error", reject);
      });
    }

    const address = server.address();
    const port =
      typeof address === "object" && address !== null
        ? address.port
        : config.port;
    return { url: `http://${config.host}:${port}` };
  };

  const stop = async () => {
    container?.ptyService.killAll();
    await container?.providerEventHub.stop();
    await new Promise<void>((resolve, reject) => {
      if (!server) {
        resolve();
        return;
      }
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = null;
    container = null;
  };

  return { start, stop };
}
