import { serve, type ServerType } from "@hono/node-server";
import { WebSocketServer } from "ws";
import { createApp } from "../server";
import { createContainer } from "../container";
import { AppOption, loadConfig, resolveConfigDir } from "../config/config";
import type { Container } from "../container";

export function createServer({
  secureLanAccess = false,
  ...option
}: AppOption & { secureLanAccess?: boolean }) {
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
      secureLanAccess,
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
    const displayHost = config.host === "0.0.0.0" ? "127.0.0.1" : config.host;
    return { url: `http://${displayHost}:${port}`, hostname: config.host };
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
