import { createEchoAdapter } from "./echo.adapter";
import { describe, expect, it } from "vitest";

describe("createEchoAdapter", () => {
  it("stores messages and streams the assistant echo as deltas", async () => {
    const adapter = createEchoAdapter();
    const session = await adapter.createSession!({ title: "Test" });
    const controller = new AbortController();
    const iterator = adapter
      .subscribeEvents({ sessionId: session.id, signal: controller.signal })
      [Symbol.asyncIterator]();

    await adapter.sendMessage!({
      sessionId: session.id,
      content: "สวัสดีครับ",
    });

    const events = [];
    while (events.at(-1)?.type !== "message.part.updated") {
      const event = await iterator.next();
      if (!event.done) events.push(event.value);
    }
    await iterator.return?.();

    expect(events[0]).toMatchObject({
      type: "message.updated",
      message: { role: "user" },
    });
    expect(events[1]).toMatchObject({
      type: "message.updated",
      message: { role: "assistant" },
    });
    const deltas = events.filter((event) => event.type === "message.delta");
    expect(deltas.length).toBeGreaterThan(1);
    expect(
      deltas
        .map((event) => (event.type === "message.delta" ? event.delta : ""))
        .join(""),
    ).toBe("สวัสดีครับ");

    const result = await adapter.listMessages!({ sessionId: session.id });
    expect(result.messages).toHaveLength(2);
    expect(result.messages[1]?.parts).toEqual([
      expect.objectContaining({ type: "text", text: "สวัสดีครับ" }),
    ]);
  });

  it("provides catalog info and isolates sessions", async () => {
    const adapter = createEchoAdapter();
    const first = await adapter.createSession!({});
    const second = await adapter.createSession!({});

    expect(await adapter.getInfo()).toMatchObject({ id: "echo", name: "Echo" });
    expect(await adapter.listSessions!({})).toHaveLength(2);
    await adapter.deleteSession!({ sessionId: first.id });
    await expect(adapter.getSession!({ sessionId: first.id })).rejects.toThrow(
      "Echo session not found",
    );
    expect(await adapter.getSession!({ sessionId: second.id })).toEqual(second);
  });
});
