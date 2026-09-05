import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
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
import type { GlobalEvent, Session, SessionStatus } from "@opencode-ai/sdk/v2";
import type { Message } from "@/types";

const KNOWN_EVENT_TYPES = new Set<string>([
  "session.updated",
  "session.idle",
  "session.status",
  "session.error",
  "message.part.updated",
  "message.part.delta",
  "message.updated",
  "question.asked",
  "permission.asked",
]);

function postOpencodeNotification(
  type: "info" | "success" | "warning",
  title: string,
  sessionID: string,
  directory: string | undefined,
) {
  const metadata: Record<string, string> = { source: "opencode", sessionID };
  if (directory) metadata.directory = directory;
  void cloudyClient.api.notifications
    .$post({ json: { type, title, message: directory ?? "", metadata } })
    .then((res) => {
      if (!res.ok) {
        console.debug("[notifications] create failed:", res.status);
      }
    })
    .catch((error) => {
      console.debug("[notifications] create failed:", error);
    });
}

export function handleEvent(
  event: GlobalEvent,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  if (!KNOWN_EVENT_TYPES.has(event.payload.type)) return;

  switch (event.payload.type) {
    case "session.updated": {
      const props = event.payload.properties;
      console.debug("[useStreamingMessages] session.updated:", props.sessionID);
      const session = props.info;

      queryClient.setQueryData<Session | null>(
        sessionKeys.detail(props.sessionID),
        session,
      );

      if (event.directory) {
        queryClient.setQueryData<Session[]>(
          sessionKeys.infinite(event.directory),
          (old) =>
            (old ?? []).map((s) => (s.id === props.sessionID ? session : s)),
        );
      }
      break;
    }

    case "session.idle": {
      const props = event.payload.properties;
      console.debug("[useStreamingMessages] session.idle:", props.sessionID);
      const sessionId = props.sessionID;

      const flushed = useStreamingMessagesStore
        .getState()
        .takeSessionStreaming(sessionId);

      if (flushed.length > 0) {
        queryClient.setQueryData<InfiniteData<Message[], string | undefined>>(
          messageKeys.infinite(sessionId),
          (old) => appendStreamingMessages(old, flushed),
        );
      }

      useSessionErrorStore.getState().clearError(sessionId);

      if (event.directory) {
        queryClient.invalidateQueries({
          queryKey: sessionKeys.infinite(event.directory),
        });
        queryClient.invalidateQueries({
          queryKey: vcsKeys.diff(event.directory),
        });
        queryClient.invalidateQueries({
          queryKey: fileKeys.root(),
        });
      }

      postOpencodeNotification(
        "success",
        "Session completed",
        sessionId,
        event.directory,
      );
      break;
    }

    case "session.status": {
      const props = event.payload.properties;
      queryClient.setQueryData<Record<string, SessionStatus>>(
        sessionKeys.statuses(event.directory),
        (old) => ({ ...(old ?? {}), [props.sessionID]: props.status }),
      );

      if (props.status.type === "busy" || props.status.type === "idle") {
        useSessionErrorStore.getState().clearError(props.sessionID);
      }
      break;
    }

    case "session.error": {
      const props = event.payload.properties;
      const error = props.error;
      console.debug("[useStreamingMessages] session.error:", props);
      if (!error) break;
      if (!props.sessionID) break;
      useSessionErrorStore.getState().setError(props.sessionID, error);
      break;
    }

    case "message.updated": {
      const props = event.payload.properties;
      console.debug("[POC] message.updated:", props);

      const summary = props.info.summary;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isShouldSkip = summary && Array.isArray((summary as any).diffs);

      if (isShouldSkip) {
        return;
      }

      useStreamingMessagesStore
        .getState()
        .onMessageInfoUpdated(props.info.sessionID, {
          info: props.info,
          parts: [],
        });
      break;
    }

    case "message.part.updated": {
      const props = event.payload.properties;
      console.debug("[POC] message.part.updated:", props);
      useStreamingMessagesStore
        .getState()
        .onMessagePartUpdated(props.part.sessionID, props.part);
      break;
    }

    case "message.part.delta": {
      const props = event.payload.properties;
      console.debug("[POC] message.part.delta:", props);
      useStreamingMessagesStore
        .getState()
        .onMessagePartDeltaUpdated(
          props.sessionID,
          props.messageID,
          props.partID,
          props.delta,
          props.field,
        );
      break;
    }

    case "question.asked": {
      const props = event.payload.properties;
      console.debug("[useStreamingMessages] session.question.asked:", props);
      queryClient.invalidateQueries({
        queryKey: questionKeys.list(event.directory),
      });
      postOpencodeNotification(
        "info",
        "Question asked",
        props.sessionID,
        event.directory,
      );
      break;
    }

    case "permission.asked": {
      const props = event.payload.properties;
      console.debug("[useStreamingMessages] permission.asked:", props);
      queryClient.invalidateQueries({
        queryKey: permissionKeys.request.root(),
      });
      postOpencodeNotification(
        "warning",
        "Permission requested",
        props.sessionID,
        event.directory,
      );
      break;
    }
  }
}
