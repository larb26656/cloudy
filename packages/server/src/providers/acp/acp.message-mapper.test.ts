import type * as acp from "@agentclientprotocol/sdk";
import { describe, expect, it } from "vitest";
import { createAcpMessageState, mapSessionUpdate } from "./acp.message-mapper";

describe("ACP message mapping", () => {
  it.each(["live", "load"] as const)(
    "keeps unknown activity between text chunks during %s",
    (source) => {
      const state = createAcpMessageState("session");
      const text = (value: string) => mapSessionUpdate(state, {
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text: value },
      }, source);
      text("before");
      mapSessionUpdate(state, {
        sessionUpdate: "vendor_activity",
        detail: "actual payload",
      } as unknown as acp.SessionUpdate, source);
      text("after");

      expect(state.messages[0]?.parts).toEqual([
        expect.objectContaining({ type: "text", text: "before" }),
        expect.objectContaining({ type: "unknown", providerType: "vendor_activity", data: { sessionUpdate: "vendor_activity", detail: "actual payload" } }),
        expect.objectContaining({ type: "text", text: "after" }),
      ]);
    },
  );
});
