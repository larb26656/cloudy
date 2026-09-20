import { useMemo } from "react";
import type { Message } from "@repo/ui/components/message/types";
import { reconcileMessages, useStreamingMessagesStore } from "@repo/opencode";
import { isInjectedContextMessage } from "../lib/opencode/sessions";

export function useVisibleMessages(
  messages: Message[],
  sessionId: string | null,
) {
  const streamingMessages = useStreamingMessagesStore((state) =>
    state.streamingMessages.get(sessionId ?? ""),
  );

  return useMemo(
    () =>
      reconcileMessages(messages, streamingMessages?.values() ?? []).filter(
        (message) => !isInjectedContextMessage(message),
      ),
    [messages, streamingMessages],
  );
}
