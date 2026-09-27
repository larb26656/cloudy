import { useShallow } from "zustand/react/shallow";
import type { ChatMessage } from "@repo/contracts";
import { pickFresher } from "./message-reconciliation";
import { useStreamingMessagesStore } from "./streaming-store";

export type StreamingMessageDisplayItem =
  | { id: string; kind: "remote"; message: ChatMessage }
  | { id: string; kind: "streaming" };

export function useStreamingMessageDisplayItems(
  remoteMessages: ChatMessage[],
  sessionId: string | null,
) {
  const streamingIds = useStreamingMessagesStore(
    useShallow((state) =>
      Array.from(state.streamingMessages.get(sessionId ?? "")?.keys() ?? []),
    ),
  );
  const streaming =
    useStreamingMessagesStore
      .getState()
      .streamingMessages.get(sessionId ?? "")
      ?.values() ?? [];
  const byId = new Map(
    Array.from(streaming, (message) => [message.id, message]),
  );
  const remoteIds = new Set(remoteMessages.map((message) => message.id));
  const displayItems = [
    ...remoteMessages.map((remote) => {
      const current = byId.get(remote.id);
      return current && pickFresher(remote, current) === "streaming"
        ? { id: remote.id, kind: "streaming" as const }
        : { id: remote.id, kind: "remote" as const, message: remote };
    }),
    ...Array.from(byId.keys())
      .filter((id) => !remoteIds.has(id))
      .map((id) => ({ id, kind: "streaming" as const })),
  ];
  return { displayItems, streamingIds };
}
