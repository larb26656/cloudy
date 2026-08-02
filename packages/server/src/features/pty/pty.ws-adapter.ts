import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import type { PtyService } from "./pty.service";

const STREAM_PATH = /^\/api\/pty\/sessions\/([^/]+)\/stream$/;

/**
 * Attach a raw `ws` WebSocketServer to the underlying Node http.Server.
 * Handles the `upgrade` event for `/api/pty/sessions/:id/stream` URLs and
 * pipes bidirectional bytes between the socket and the PTY. All other
 * upgrade requests are rejected (404).
 *
 * Used by `createServer` once the Hono http.Server is up. Kept separate
 * from the Hono app because the installed `@hono/node-server` version has
 * no built-in WS bridge.
 */
export function attachPtyWebSockets(server: Server, ptyService: PtyService) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const match = STREAM_PATH.exec(url.pathname);
    if (!match) {
      socket.destroy();
      return;
    }
    const id = decodeURIComponent(match[1]!);

    // Validate session existence before accepting the upgrade so missing
    // ids fail fast with a clean 404 rather than a silent WS open/close.
    try {
      ptyService.getSession(id);
    } catch {
      socket.write(
        "HTTP/1.1 404 Not Found\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
      );
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      pipeSession(ws, id, ptyService);
    });
  });

  return wss;
}

/**
 * Wire a single WebSocket to a PTY session. Stdout/stderr from the PTY →
 * socket (raw bytes); socket messages → PTY stdin. On PTY exit, the socket
 * is closed (client polls `GET /sessions/:id` for the exit code, since the
 * raw wire protocol carries no structured events).
 */
function pipeSession(ws: WebSocket, id: string, ptyService: PtyService) {
  const offData = ptyService.onData(id, (data) => {
    if (ws.readyState === ws.OPEN) ws.send(data);
  });
  const offExit = ptyService.onExit(id, () => {
    offData();
    offExit();
    try {
      ws.close(1000, "pty exit");
    } catch {
      // already closed
    }
  });

  ws.on("message", (msg, isBinary) => {
    const buf = Buffer.isBuffer(msg)
      ? msg
      : Array.isArray(msg)
        ? Buffer.concat(msg.map((c) => Buffer.from(c)))
        : Buffer.from(msg);
    const data = isBinary ? buf.toString("utf8") : buf.toString("utf8");
    try {
      ptyService.write(id, data);
    } catch {
      // session died mid-write — close the socket
      ws.close(1011, "pty gone");
    }
  });

  ws.on("close", () => {
    offData();
    offExit();
  });

  ws.on("error", () => {
    offData();
    offExit();
  });
}
