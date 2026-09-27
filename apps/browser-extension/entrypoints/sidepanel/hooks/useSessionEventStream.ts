import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@repo/ui/components/message/types";
import { mergeMessages, useStreamingMessagesStore } from "@repo/opencode";
import { subscribeToEvents } from "../lib/opencode/events";
import { sessionKeys, sessionMessageKeys } from "../queries/query-keys";
import { useChatStore } from "../stores/chatStore";
import { useSessionStore } from "../stores/sessionStore";

export function useSessionEventStream(directory: string) {
  const queryClient = useQueryClient();
  const isSessionHydrating = useSessionStore((state) => state.isHydrating);
  const takeSessionStreaming = useStreamingMessagesStore(
    (state) => state.takeSessionStreaming,
  );

  useEffect(() => {
    if (isSessionHydrating) return;

    const controller = new AbortController();

    void (async () => {
      await subscribeToEvents(
        directory,
        (event) => {
          const currentSessionId = useSessionStore.getState().sessionId;

          if (
            event.type === "session.status" &&
            event.sessionId === currentSessionId
          ) {
            useChatStore
              .getState()
              .setIsGenerating(
                event.runStatus === "running" ||
                  (typeof event.status === "object" &&
                    event.status.type === "retry"),
              );
            if (event.runStatus === "completed" || event.status === "idle") {
              useChatStore.getState().setIsGenerating(false);
            }
          }

          if (
            event.type === "run.failed" &&
            event.sessionId === currentSessionId
          ) {
            useChatStore.getState().setIsGenerating(false);
            useChatStore
              .getState()
              .setError(event.message ?? "Provider reported an error");
          }

          if (
            event.type === "session.status" &&
            (event.status === "idle" || event.runStatus === "completed")
          ) {
            const idleSessionId = event.sessionId;
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
            void queryClient.invalidateQueries({
              queryKey: sessionKeys.root(),
            });
            return;
          }

          if (currentSessionId) {
            useStreamingMessagesStore
              .getState()
              .applyEvent(currentSessionId, event);
          }
        },
        controller.signal,
      );
    })().catch((loadError: unknown) => {
      if (!controller.signal.aborted)
        useChatStore
          .getState()
          .setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to connect to Cloudy",
          );
    });

    return () => {
      controller.abort();
    };
  }, [directory, isSessionHydrating, queryClient, takeSessionStreaming]);
}
