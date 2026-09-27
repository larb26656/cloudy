import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { ChatEvent } from "@repo/contracts";
import { cloudyClient } from "@/lib/api";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import { useSessionErrorStore } from "@/stores/sessionErrorStore";
import {
  fileKeys,
  messageKeys,
  permissionKeys,
  questionKeys,
  sessionKeys,
  vcsKeys,
} from "@/lib/opencode";
import { appendStreamingMessages } from "@/lib/opencode/appendStreamingMessages";
import type { Message, SessionErrorInfo, SessionRunStatus } from "@/types";

function postNotification(
  type: "info" | "success" | "warning",
  title: string,
  sessionId: string,
  directory?: string,
) {
  void cloudyClient.api.notifications
    .$post({
      json: {
        type,
        title,
        message: directory ?? "",
        metadata: {
          source: "opencode",
          sessionID: sessionId,
          ...(directory ? { directory } : {}),
        },
      },
    })
    .catch(() => undefined);
}

function statusFor(
  event: Extract<ChatEvent, { type: "session.status" }>,
): SessionRunStatus {
  if (event.runStatus === "running") return { type: "busy" };
  if (event.runStatus === "queued")
    return { type: "retry", attempt: 0, message: "", next: 0 };
  return { type: "idle" };
}

export function handleEvent(
  event: ChatEvent,
  queryClient: ReturnType<typeof useQueryClient>,
  directory?: string,
) {
  switch (event.type) {
    case "session.status": {
      queryClient.setQueryData<Record<string, SessionRunStatus>>(
        sessionKeys.statuses(directory ?? ""),
        (old) => ({ ...(old ?? {}), [event.sessionId]: statusFor(event) }),
      );
      if (event.runStatus === "completed" || event.status === "idle") {
        const flushed = useStreamingMessagesStore
          .getState()
          .takeSessionStreaming(event.sessionId);
        if (flushed.length > 0)
          queryClient.setQueryData<InfiniteData<Message[], string | undefined>>(
            messageKeys.infinite(event.sessionId),
            (old) => appendStreamingMessages(old, flushed),
          );
        useSessionErrorStore.getState().clearError(event.sessionId);
        if (directory) {
          void queryClient.invalidateQueries({
            queryKey: sessionKeys.infinite(directory),
          });
          void queryClient.invalidateQueries({
            queryKey: vcsKeys.diff(directory),
          });
          void queryClient.invalidateQueries({ queryKey: fileKeys.root() });
        }
        postNotification(
          "success",
          "Session completed",
          event.sessionId,
          directory,
        );
      }
      break;
    }
    case "message.updated":
    case "message.part.updated":
    case "message.delta":
      useStreamingMessagesStore.getState().applyEvent(event.sessionId, event);
      break;
    case "approval.requested":
      void queryClient.invalidateQueries({
        queryKey: permissionKeys.request.root(),
      });
      postNotification(
        "warning",
        "Permission requested",
        event.sessionId,
        directory,
      );
      break;
    case "question.requested":
      void queryClient.invalidateQueries({
        queryKey: questionKeys.list(directory ?? ""),
      });
      postNotification("info", "Question asked", event.sessionId, directory);
      break;
    case "run.failed":
      useSessionErrorStore.getState().setError(event.sessionId, {
        name: "SessionError",
        message: event.message,
        data:
          typeof event.error === "object" && event.error !== null
            ? (event.error as SessionErrorInfo["data"])
            : {},
      });
      break;
  }
}
