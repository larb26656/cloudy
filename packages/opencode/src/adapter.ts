import type {
  ChatMessage,
  ChatEvent,
  MessagePart,
  RunStatus,
  SessionStatus,
} from "@repo/ai-core";
import type {
  GlobalEvent,
  Message as OpencodeMessage,
  Part,
} from "@opencode-ai/sdk/v2";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue {
  return typeof value === "object" && value !== null
    ? (value as RecordValue)
    : {};
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function createdAt(info: OpencodeMessage): string {
  const time = asRecord(info.time);
  const created = time.created;
  return typeof created === "number"
    ? new Date(created).toISOString()
    : new Date(0).toISOString();
}

function mapStatus(value: unknown): RunStatus {
  if (value === "running" || value === "busy") return "running";
  if (value === "completed" || value === "idle") return "completed";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  if (value === "failed" || value === "error") return "failed";
  return "queued";
}

function mapPart(part: Part): MessagePart {
  const source = asRecord(part);
  const base = {
    id: stringValue(source.id, "unknown-part"),
    metadata: { provider: "opencode", raw: source },
  };

  switch (source.type) {
    case "text":
      return { ...base, type: "text", text: stringValue(source.text, "") };
    case "reasoning":
      return { ...base, type: "reasoning", text: stringValue(source.text, "") };
    case "tool": {
      const state = asRecord(source.state);
      const status = state.status;
      return {
        ...base,
        type: "tool",
        toolName: stringValue(source.tool, "unknown"),
        callId: typeof source.callID === "string" ? source.callID : undefined,
        status:
          status === "running" || status === "completed" || status === "error"
            ? status === "error"
              ? "failed"
              : status
            : "pending",
        input: state.input,
        output: state.output,
        error: typeof state.error === "string" ? state.error : undefined,
      };
    }
    case "file":
      return {
        ...base,
        type: "file",
        path: stringValue(source.filename, stringValue(source.url, "")),
        mimeType: typeof source.mime === "string" ? source.mime : undefined,
        url: typeof source.url === "string" ? source.url : undefined,
      };
    case "patch":
      return {
        ...base,
        type: "diff",
        path: stringValue(source.file, "unknown"),
        patch: stringValue(source.patch, ""),
      };
    case "subtask":
      return {
        ...base,
        type: "subtask",
        sessionId:
          typeof source.sessionID === "string" ? source.sessionID : undefined,
        description: stringValue(source.description, ""),
        status:
          source.status === undefined ? undefined : mapStatus(source.status),
      };
    case "compaction":
      return {
        ...base,
        type: "compaction",
        summary: typeof source.auto === "string" ? source.auto : undefined,
      };
    default:
      return {
        ...base,
        type: "unknown",
        providerType: stringValue(source.type, "unknown"),
        data: source,
      };
  }
}

export function toChatMessage(
  info: OpencodeMessage,
  parts: Part[] = [],
): ChatMessage {
  const sessionId = stringValue(info.sessionID, "");
  const role = info.role === "user" ? "user" : "assistant";

  return {
    id: info.id,
    sessionId,
    role,
    parts: parts.map(mapPart),
    createdAt: createdAt(info),
    metadata: { provider: "opencode", raw: info },
  };
}

export function toChatEvent(event: GlobalEvent): ChatEvent | undefined {
  const payload = asRecord(event.payload);
  const properties = asRecord(payload.properties);
  const sessionId = stringValue(properties.sessionID, "");

  switch (payload.type) {
    case "message.part.delta":
      return {
        type: "message.delta",
        sessionId,
        messageId: stringValue(properties.messageID, ""),
        partId: stringValue(properties.partID, ""),
        delta: stringValue(properties.delta, ""),
      };
    case "message.part.updated": {
      const part = properties.part;
      if (!part || typeof part !== "object") return undefined;
      return {
        type: "message.part.updated",
        sessionId,
        messageId: stringValue(asRecord(part).messageID, ""),
        part: mapPart(part as Part),
      };
    }
    case "message.updated": {
      const info = properties.info;
      if (!info || typeof info !== "object") return undefined;
      return {
        type: "message.updated",
        sessionId,
        message: toChatMessage(info as OpencodeMessage),
      };
    }
    case "session.status": {
      const status = asRecord(properties.status);
      return {
        type: "session.status",
        sessionId,
        status: mapSessionStatus(status.type),
        runStatus: mapStatus(status.type),
      };
    }
    default:
      return undefined;
  }
}

function mapSessionStatus(value: unknown): SessionStatus {
  if (value === "active" || value === "busy") return "active";
  if (value === "paused" || value === "retry") return "paused";
  if (value === "closed") return "closed";
  return "idle";
}
