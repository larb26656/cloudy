import type { WSEvents, WSMessageReceive } from "hono/ws";
import type { PtyService } from "./pty.service";

/**
 * Wire a Hono WebSocket route to a PTY session. Stdout/stderr from the PTY
 * goes to the socket and socket messages go to PTY stdin.
 */
export function createPtyWebSocketEvents(
  id: string,
  ptyService: PtyService,
): WSEvents {
  let offData: (() => void) | null = null;
  let offExit: (() => void) | null = null;

  const cleanup = () => {
    offData?.();
    offExit?.();
    offData = null;
    offExit = null;
  };

  return {
    onOpen(_event, ws) {
      offData = ptyService.onData(id, (data) => {
        if (ws.readyState === 1) ws.send(data);
      });
      offExit = ptyService.onExit(id, () => {
        cleanup();
        ws.close(1000, "pty exit");
      });
    },
    async onMessage(event, ws) {
      try {
        ptyService.write(id, await decodeMessage(event.data));
      } catch {
        ws.close(1011, "pty gone");
      }
    },
    onClose() {
      cleanup();
    },
    onError() {
      cleanup();
    },
  };
}

async function decodeMessage(data: WSMessageReceive): Promise<string> {
  if (typeof data === "string") return data;
  if (data instanceof Blob) return data.text();
  return Buffer.from(data).toString("utf8");
}
