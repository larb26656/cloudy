import { serve, type ServerType } from "@hono/node-server";
import type { Server } from "node:http";
import { createApp } from "../server";
import { createContainer } from "../container";
import { AppOption, loadConfig } from "../config/config";
import { attachPtyWebSockets } from "../features/pty";

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
