import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Message } from "./message-stream";
import { pickFresher } from "./message-reconciliation";
import { useStreamingMessagesStore } from "./streaming-store";

export type StreamingMessageDisplayItem =
  | { id: string; kind: "remote"; message: Message }
  | { id: string; kind: "streaming" };

export function getStreamingMessageDisplayItems(
  remoteMessages: Message[],
  streamingMessages: Iterable<Message>,
  shouldIncludeMessage: (message: Message) => boolean = () => true,
): StreamingMessageDisplayItem[] {
  const streamingById = new Map(
    Array.from(streamingMessages, (message) => [message.info.id, message]),
  );
  const remoteIds = new Set(remoteMessages.map((message) => message.info.id));
  const displayItems: StreamingMessageDisplayItem[] = [];

  for (const remote of remoteMessages) {
    const streaming = streamingById.get(remote.info.id);
    if (
      !shouldIncludeMessage(remote) ||
      (streaming && !shouldIncludeMessage(streaming))
    ) {
      continue;
    }
    if (streaming && pickFresher(remote, streaming) === "streaming") {
      displayItems.push({ id: remote.info.id, kind: "streaming" });
    } else {
      displayItems.push({
        id: remote.info.id,
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
  remoteMessages: Message[],
  sessionId: string | null,
  shouldIncludeMessage?: (message: Message) => boolean,
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
