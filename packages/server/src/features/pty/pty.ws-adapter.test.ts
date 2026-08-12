import { describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import type { WSContext } from "hono/ws";
import type { PtyService } from "./pty.service";
import { createPtyWebSocketEvents } from "./pty.ws-adapter";

function createTestSocket() {
  return {
    readyState: 1,
    send: vi.fn(),
    close: vi.fn(),
  } as unknown as WSContext;
}

describe("createPtyWebSocketEvents", () => {
  it("pipes PTY output and socket messages in both directions", async () => {
    const service = mock<PtyService>();
    const ws = createTestSocket();
    let emitData: ((data: string) => void) | undefined;

    service.onData.mockImplementation((_id, listener) => {
      emitData = listener;
      return vi.fn();
    });
    service.onExit.mockReturnValue(vi.fn());

    const events = createPtyWebSocketEvents("pty-1", service);
    events.onOpen?.(new Event("open"), ws);
    emitData?.("ready\r\n");
    await events.onMessage?.(new MessageEvent("message", { data: "ls\n" }), ws);

    expect(ws.send).toHaveBeenCalledWith("ready\r\n");
    expect(service.write).toHaveBeenCalledWith("pty-1", "ls\n");
  });

  it("unsubscribes and closes the socket when the PTY exits", () => {
    const service = mock<PtyService>();
    const ws = createTestSocket();
    const offData = vi.fn();
    const offExit = vi.fn();
    let emitExit: (() => void) | undefined;

    service.onData.mockReturnValue(offData);
    service.onExit.mockImplementation((_id, listener) => {
      emitExit = () => listener(0);
      return offExit;
    });

    const events = createPtyWebSocketEvents("pty-1", service);
    events.onOpen?.(new Event("open"), ws);
    emitExit?.();

    expect(offData).toHaveBeenCalledOnce();
    expect(offExit).toHaveBeenCalledOnce();
    expect(ws.close).toHaveBeenCalledWith(1000, "pty exit");
  });

  it("closes the socket when writing to the PTY fails", async () => {
    const service = mock<PtyService>();
    const ws = createTestSocket();
    service.write.mockImplementation(() => {
      throw new Error("missing session");
    });

    const events = createPtyWebSocketEvents("pty-1", service);
    await events.onMessage?.(
      new MessageEvent("message", { data: "pwd\n" }),
      ws,
    );

    expect(ws.close).toHaveBeenCalledWith(1011, "pty gone");
  });
});
