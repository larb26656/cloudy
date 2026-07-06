import { useGlobalEvent } from "@/hooks/useGlobalEvent";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import type { GlobalEvent } from "@opencode-ai/sdk/v2";

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
  | MessagePartUpdated
  | MessagePartDelta;

function isKnownEvent(event: GlobalEvent): event is GlobalEvent & KnownEvent {
  const type = event.payload.type;
  return (
    type === "session.updated" ||
    type === "session.idle" ||
    type === "message.part.updated" ||
    type === "message.part.delta"
  );
}

function handleEvent(
  event: GlobalEvent,
  store: ReturnType<typeof useStreamingMessagesStore.getState>,
) {
  // console.log(event.payload.type);
  if (!isKnownEvent(event)) return;
  // console.log("known event");

  const p = event.payload as unknown as KnownEvent["properties"];

  switch (event.payload.type) {
    case "session.updated": {
      const props = p as SessionUpdated["properties"];
      console.log("[POC] session.updated:", event.payload.properties);
      break;
    }

    case "session.idle": {
      const props = p as SessionIdle["properties"];
      console.log("[POC] session.idle:", event.payload.properties);
      const streaming = store.getStreamingMessage(props.sessionID);
      if (streaming) {
        store.clearStreamingMessage(props.sessionID);
      }
      break;
    }

    case "message.part.updated": {
      const props = p as MessagePartUpdated["properties"];
      console.log("[POC] message.part.updated:", event.payload.properties);
      break;
    }

    case "message.part.delta": {
      const props = p as MessagePartDelta["properties"];
      console.log("[POC] message.part.delta:", event.payload.properties);
      break;
    }
  }
}

export function useStreamingMessages() {
  const store = useStreamingMessagesStore();

  useGlobalEvent(
    (event) => {
      handleEvent(event, store);
    },
    (status, error) => {
      if (status === "error") {
        console.error("[useStreamingMessages] Event stream error:", error);
      }
    },
  );

  return store;
}
