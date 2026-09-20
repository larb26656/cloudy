import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@repo/ui/components/message/types";
import { mergeMessages, useStreamingMessagesStore } from "@repo/opencode";
import { dispatchStreamEvent, subscribeToEvents } from "../lib/opencode/events";
import { sessionKeys, sessionMessageKeys } from "../queries/query-keys";
import { useChatStore } from "../stores/chatStore";
import { useSessionStore } from "../stores/sessionStore";

export function useSessionEventStream(directory: string) {
  const queryClient = useQueryClient();
  const hydrateSession = useSessionStore((state) => state.hydrate);
  const takeSessionStreaming = useStreamingMessagesStore(
    (state) => state.takeSessionStreaming,
  );

  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | undefined;

    void (async () => {
      await hydrateSession();
      if (cancelled) return;

      stop = await subscribeToEvents(directory, (event) => {
        const currentSessionId = useSessionStore.getState().sessionId;

        if (
          event.payload.type === "session.status" &&
          event.payload.properties.sessionID === currentSessionId
        ) {
          const status = event.payload.properties.status.type;
          useChatStore
            .getState()
            .setIsGenerating(status === "busy" || status === "retry");
        }

        if (
          event.payload.type === "session.error" &&
          event.payload.properties.sessionID === currentSessionId
        ) {
          useChatStore.getState().setIsGenerating(false);
          useChatStore.getState().setError("OpenCode reported an error");
        }

        if (event.payload.type === "session.idle") {
          const idleSessionId = event.payload.properties.sessionID;
          if (idleSessionId === currentSessionId) {
            useChatStore.getState().setIsGenerating(false);
          }
          const streamedMessages = takeSessionStreaming(idleSessionId);
          queryClient.setQueryData<Message[]>(
            sessionMessageKeys.detail(directory, idleSessionId),
            (cachedMessages = []) =>
              mergeMessages(cachedMessages, streamedMessages),
          );
          void queryClient.invalidateQueries({
            queryKey: sessionMessageKeys.detail(directory, idleSessionId),
          });
          void queryClient.invalidateQueries({ queryKey: sessionKeys.root() });
          return;
        }

        if (currentSessionId) dispatchStreamEvent(event, currentSessionId);
      });
    })().catch((loadError: unknown) => {
      if (!cancelled)
        useChatStore
          .getState()
          .setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to connect to Cloudy",
          );
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [directory, hydrateSession, queryClient, takeSessionStreaming]);
}
