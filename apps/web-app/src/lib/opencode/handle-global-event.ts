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
  const eventDirectory = directory ?? event.directory;
  switch (event.type) {
    case "session.status": {
      queryClient.setQueryData(
        sessionKeys.status(event.sessionId),
        statusFor(event),
      );
      if (event.runStatus === "running")
        useSessionErrorStore.getState().clearError(event.sessionId);
      if (event.runStatus === "completed" || event.status === "idle") {
        const flushed = useStreamingMessagesStore
          .getState()
          .takeSessionStreaming(event.sessionId);
        if (flushed.length > 0)
          queryClient.setQueryData<InfiniteData<Message[], string | undefined>>(
            messageKeys.infinite(event.sessionId),
            (old) => appendStreamingMessages(old, flushed),
          );
        if (eventDirectory) {
          void queryClient.invalidateQueries({
            queryKey: sessionKeys.infinite(eventDirectory),
          });
          void queryClient.invalidateQueries({
            queryKey: vcsKeys.diff(eventDirectory),
          });
          void queryClient.invalidateQueries({ queryKey: fileKeys.root() });
        }
        postNotification(
          "success",
          "Session completed",
          event.sessionId,
          eventDirectory,
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
        eventDirectory,
      );
      break;
    case "question.requested":
      void queryClient.invalidateQueries({
        queryKey: questionKeys.list(eventDirectory ?? ""),
      });
      postNotification(
        "info",
        "Question asked",
        event.sessionId,
        eventDirectory,
      );
      break;
    case "run.failed":
      {
        const error =
          typeof event.error === "object" && event.error !== null
            ? (event.error as Record<string, unknown>)
            : {};
        const rawData = error.data;
        const errorDetails = { ...error };
        delete errorDetails.data;
        delete errorDetails.name;
        const data =
          typeof rawData === "object" && rawData !== null
            ? ({
                ...errorDetails,
                ...(rawData as SessionErrorInfo["data"]),
              } as SessionErrorInfo["data"])
            : (errorDetails as SessionErrorInfo["data"]);
        useSessionErrorStore.getState().setError(event.sessionId, {
          name: typeof error.name === "string" ? error.name : "SessionError",
          message: event.message ?? data.message,
          data,
        });
      }
      break;
    case "provider.connection":
      break;
  }
}
