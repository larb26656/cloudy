import { serve, type ServerType } from "@hono/node-server";
import type { Server } from "node:http";
import { createApp } from "../server";
import { createContainer } from "../container";
import {
  ensureConfigFile,
  parseConfig,
  resolveConfigDir,
} from "../config/config";
import { attachPtyWebSockets } from "../features/pty";

export interface ServerOptions {
  host?: string;
  port?: number;
  dataDir?: string;
  configDir?: string;
  corsOrigins?: string[];
  enableUI?: boolean;
  publicDir?: string;
}

export function createServer(options: ServerOptions) {
  let server: ServerType | null = null;

  const start = async () => {
    const resolvedConfigDir = resolveConfigDir(options.configDir);
    const configPath = ensureConfigFile(resolvedConfigDir);
    const config = parseConfig({
      configPath,
      configDir: resolvedConfigDir,
      cliFlags: {
        configDir: options.configDir,
        ui: options.enableUI,
        host: options.host?.toString(),
        port: options.port?.toString(),
        cors: options.corsOrigins?.join(",") ?? "",
      },
    });

    const container = createContainer(config);

    const app = createApp({
      corsOrigins: config.cors,
      enableUI: config.ui,
      publicDir: options.publicDir,
      container,
    });

    server = serve({
      fetch: app.fetch,
      port: config.port,
      hostname: config.host,
    });

    // Wire the PTY WebSocket on the underlying Node http.Server. Done after
    // `serve()` returns because @hono/node-server 1.19 has no built-in WS
    // bridge; raw `ws` handles the `upgrade` event for /api/pty/sessions/:id/stream.
    // Cast: ServerType is a union of HTTP/HTTPS/HTTP2 servers; we only ever
    // start plain HTTP1 so the runtime type is `Server`.
    attachPtyWebSockets(server as Server, container.ptyService);

    const url = `http://${config.host}:${config.port}`;
    return { url };
  };

  const stop = async () => {
    server?.close();
    server = null;
  };

  return { start, stop };
}
