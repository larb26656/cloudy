import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { ChatMessage } from "@repo/ai-core";
import { pickFresher } from "./message-reconciliation";
import { useStreamingMessagesStore } from "./streaming-store";

export type StreamingMessageDisplayItem =
  | { id: string; kind: "remote"; message: ChatMessage }
  | { id: string; kind: "streaming" };

export function getStreamingMessageDisplayItems(
  remoteMessages: ChatMessage[],
  streamingMessages: Iterable<ChatMessage>,
  shouldIncludeMessage: (message: ChatMessage) => boolean = () => true,
): StreamingMessageDisplayItem[] {
  const streamingById = new Map(
    Array.from(streamingMessages, (message) => [message.id, message]),
  );
  const remoteIds = new Set(remoteMessages.map((message) => message.id));
  const displayItems: StreamingMessageDisplayItem[] = [];

  for (const remote of remoteMessages) {
    const streaming = streamingById.get(remote.id);
    if (
      !shouldIncludeMessage(remote) ||
      (streaming && !shouldIncludeMessage(streaming))
    ) {
      continue;
    }
    if (streaming && pickFresher(remote, streaming) === "streaming") {
      displayItems.push({ id: remote.id, kind: "streaming" });
    } else {
      displayItems.push({
        id: remote.id,
        kind: "remote",
        message: remote,
      });
    }
  }

  for (const [id, streaming] of streamingById) {
    if (!remoteIds.has(id) && shouldIncludeMessage(streaming)) {
      displayItems.push({ id, kind: "streaming" });
    }
  }

  return displayItems;
}

export function useStreamingMessageDisplayItems(
  remoteMessages: ChatMessage[],
  sessionId: string | null,
  shouldIncludeMessage?: (message: ChatMessage) => boolean,
) {
  const streamingIds = useStreamingMessagesStore(
    useShallow((state) => {
      const messages = state.streamingMessages.get(sessionId ?? "");
      return messages ? Array.from(messages.keys()) : [];
    }),
  );

  const displayItems = useMemo(() => {
    const streamingMessages = useStreamingMessagesStore
      .getState()
      .streamingMessages.get(sessionId ?? "");
    return getStreamingMessageDisplayItems(
      remoteMessages,
      streamingMessages?.values() ?? [],
      shouldIncludeMessage,
    );
  }, [remoteMessages, sessionId, shouldIncludeMessage, streamingIds]);

  return {
    displayItems,
    streamingIds: displayItems
      .filter((item) => item.kind === "streaming")
      .map((item) => item.id),
  };
}
