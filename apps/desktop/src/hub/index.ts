import { createServer } from "node:http";
import { createHubRouter } from "./server";
import { HubContextStore } from "./context-store";
import type { BrowserWindow } from "electron";

export function startHub(mainWindow: BrowserWindow) {
  const broadcast = (event: string, data: unknown) => {
    mainWindow.webContents.send(event, data);
  };

  const focusWindow = () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  };

  const store = new HubContextStore(broadcast, focusWindow);
  const app = createHubRouter(store);

  const port = 4242;

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const method = req.method ?? "GET";
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value.join(", ");
      }
    }

    let body: ArrayBuffer | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks);
      body = new Uint8Array(raw).buffer as ArrayBuffer;
    }

    const request = new Request(url, {
      method,
      headers,
      body: body?.byteLength ? body : undefined,
    });

    const response = await app.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const responseBody = await response.arrayBuffer();
    res.end(new Uint8Array(responseBody));
  });

  server.listen(port, () => {
    console.log(`Hub server listening on http://localhost:${port}`);
  });

  return { store, app, server };
}
