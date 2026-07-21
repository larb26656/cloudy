import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useGlobalEvent } from "@/hooks/useGlobalEvent";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import { messageKeys, permissionKeys, questionKeys, sessionKeys } from "@/lib/opencode";
import { appendStreamingMessages } from "@/lib/opencode/appendStreamingMessages";
import type { GlobalEvent, MessageUpdated, SessionStatus } from "@opencode-ai/sdk/v2";
import type { Message } from "@/types";

type SessionUpdated = {
  type: "session.updated";
  properties: {
    sessionID: string;
  };
};

type SessionIdle = {
  type: "session.idle";
  properties: {
    sessionID: string;
  };
};

type SessionStatusEvent = {
  type: "session.status";
  properties: {
    sessionID: string;
    status: SessionStatus;
  };
};

type MessagePartUpdated = {
  type: "message.part.updated";
  properties: {
    sessionID: string;
    partID: string;
    part: unknown;
    time: number;
  };
};

type MessagePartDelta = {
  type: "message.part.delta";
  properties: {
    sessionID: string;
    messageID: string;
    partID: string;
    field: string;
    delta: string;
  };
};

type KnownEvent =
  | SessionUpdated
  | SessionIdle
  | SessionStatusEvent
  | MessageUpdated
  | MessagePartUpdated
  | MessagePartDelta;

function isKnownEvent(event: GlobalEvent): event is GlobalEvent & KnownEvent {
  const type = event.payload.type;
  return (
    type === "session.updated" ||
    type === "session.idle" ||
    type === "session.status" ||
    type === "message.part.updated" ||
    type === "message.part.delta" ||
    type === "message.updated" ||
    type === "question.asked" ||
    type === "permission.asked"
  );
}

function shouldBufferMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  directory: string | undefined,
  sessionId: string,
): boolean {
  if (!directory) return true;
  const statuses = queryClient.getQueryData<Record<string, SessionStatus>>(
    sessionKeys.statuses(directory),
  );
  const status = statuses?.[sessionId];
  return !status || status.type === "busy" || status.type === "retry";
}

function handleEvent(
  event: GlobalEvent,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  if (!isKnownEvent(event)) return;

  switch (event.payload.type) {
    case "session.updated": {
      const props = event.payload.properties;
      console.log("[useStreamingMessages] session.updated:", props);
      queryClient.invalidateQueries({ queryKey: sessionKeys.root() });
      break;
    }

    case "session.idle": {
      const props = event.payload.properties;
      console.log("[useStreamingMessages] session.idle:", props.sessionID);
      const sessionId = props.sessionID;

      const flushed = useStreamingMessagesStore
        .getState()
        .takeSessionStreaming(sessionId);

      if (flushed.length === 0) return;

      queryClient.setQueryData<InfiniteData<Message[], string | undefined>>(
        messageKeys.infinite(sessionId),
        (old) => appendStreamingMessages(old, flushed),
      );
      break;
    }

    case "session.status": {
      const props = event.payload.properties;
      queryClient.setQueryData<Record<string, SessionStatus>>(
        sessionKeys.statuses(event.directory),
        (old) => ({ ...(old ?? {}), [props.sessionID]: props.status }),
      );
      break;
    }

    case "message.updated": {
      const props = event.payload.properties;
      console.log("[POC] message.updated:", props);

      const summary = props.info.summary;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isShouldSkip = summary && Array.isArray((summary as any).diffs);

      if (isShouldSkip) {
        return;
      }

      if (
        !shouldBufferMessage(queryClient, event.directory, props.info.sessionID)
      ) {
        queryClient.invalidateQueries({
          queryKey: messageKeys.infinite(props.info.sessionID),
        });
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
      console.log("[POC] message.part.updated:", props);
      if (!shouldBufferMessage(queryClient, event.directory, props.part.sessionID)) {
        queryClient.invalidateQueries({
          queryKey: messageKeys.infinite(props.part.sessionID),
        });
        return;
      }
      useStreamingMessagesStore
        .getState()
        .onMessagePartUpdated(props.part.sessionID, props.part);
      break;
    }

    case "message.part.delta": {
      const props = event.payload.properties;
      console.log("[POC] message.part.delta:", props);
      if (!shouldBufferMessage(queryClient, event.directory, props.sessionID)) {
        return;
      }
      useStreamingMessagesStore
        .getState()
        .onMessagePartDeltaUpdated(props.sessionID, props.messageID, props.partID, props.delta)
      break;
    }

    case "question.asked": {
      const props = event.payload.properties;
      console.log("[useStreamingMessages] session.question.asked:", props);
      queryClient.invalidateQueries({ queryKey: questionKeys.list(event.directory) });
      break;
    }

    case "permission.asked": {
      const props = event.payload.properties;
      console.log("[useStreamingMessages] permission.asked:", props);
      queryClient.invalidateQueries({ queryKey: permissionKeys.request.root() });
      break;
    }
  }
}

export function useStreamingMessages() {
  const queryClient = useQueryClient();
  useGlobalEvent(
    (event) => {
      handleEvent(event, queryClient);
    },
    (status, error) => {
      if (status === "error") {
        console.error("[useStreamingMessages] Event stream error:", error);
      }
    },
  );
}
