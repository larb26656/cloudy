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

export interface OpenCodeMessageWithParts {
  info: OpencodeMessage;
  parts: Part[];
}

function asRecord(value: unknown): RecordValue {
  return typeof value === "object" && value !== null
    ? (value as RecordValue)
    : {};
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function unknownProviderType(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : "<missing>";
}

function createdAt(info: OpencodeMessage): string {
  const time = asRecord(info.time);
  const created = time.created;
  return typeof created === "number"
    ? new Date(created).toISOString()
    : new Date(0).toISOString();
}

function updatedAt(info: OpencodeMessage): string | undefined {
  const completed = asRecord(info.time).completed;
  return typeof completed === "number"
    ? new Date(completed).toISOString()
    : undefined;
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
    case "step-start":
      return {
        ...base,
        type: "step-start",
        snapshot:
          typeof source.snapshot === "string" ? source.snapshot : undefined,
      };
    case "step-finish": {
      const tokens = asRecord(source.tokens);
      const cache = asRecord(tokens.cache);
      return {
        ...base,
        type: "step-finish",
        reason: stringValue(source.reason, "unknown"),
        modelID:
          typeof source.modelID === "string" ? source.modelID : undefined,
        agent: typeof source.agent === "string" ? source.agent : undefined,
        cost: typeof source.cost === "number" ? source.cost : 0,
        tokens: {
          input: typeof tokens.input === "number" ? tokens.input : 0,
          output: typeof tokens.output === "number" ? tokens.output : 0,
          reasoning:
            typeof tokens.reasoning === "number" ? tokens.reasoning : 0,
          cache: {
            read: typeof cache.read === "number" ? cache.read : 0,
            write: typeof cache.write === "number" ? cache.write : 0,
          },
        },
      };
    }
    case "snapshot":
      return {
        ...base,
        type: "snapshot",
        snapshot: stringValue(source.snapshot, ""),
      };
    case "agent":
      return {
        ...base,
        type: "agent",
        name: stringValue(source.name, "unknown"),
      };
    case "retry":
      return {
        ...base,
        type: "retry",
        attempt: typeof source.attempt === "number" ? source.attempt : 0,
        error: asRecord(source.error) as {
          message?: string;
          statusCode?: number;
        },
      };
    default:
      console.warn("[opencode] Unknown message part", {
        providerType: unknownProviderType(source.type),
        id: source.id,
        sessionID: source.sessionID,
        messageID: source.messageID,
        tool: source.tool,
        callID: source.callID,
        keys: Object.keys(source),
        part: source,
      });
      return {
        ...base,
        type: "unknown",
        providerType: unknownProviderType(source.type),
        data: source,
      };
  }
}

export function toChatMessage(
  info: OpencodeMessage,
  parts: Part[] = [],
): ChatMessage {
  const source = asRecord(info);
  const sessionId = stringValue(info.sessionID, "");
  const role = info.role === "user" ? "user" : "assistant";
  const modelID =
    typeof source.modelID === "string" ? source.modelID : undefined;
  const agent = typeof source.agent === "string" ? source.agent : undefined;

  return {
    id: info.id,
    sessionId,
    role,
    parts: parts.map(mapPart).map((part) => {
      if (part.type !== "step-finish") return part;
      return {
        ...part,
        modelID: part.modelID ?? modelID,
        agent: part.agent ?? agent,
      };
    }),
    createdAt: createdAt(info),
    updatedAt: updatedAt(info),
    metadata: { provider: "opencode", raw: info },
  };
}

function timestamp(value: string): number {
  const result = Date.parse(value);
  return Number.isNaN(result) ? 0 : result;
}

function toOpenCodePart(
  part: MessagePart,
  sessionId: string,
  messageId: string,
): Part {
  const raw = asRecord(part.metadata?.raw);
  const base = {
    ...raw,
    id: part.id,
    sessionID: sessionId,
    messageID: messageId,
  };

  switch (part.type) {
    case "text":
    case "reasoning":
      return { ...base, type: part.type, text: part.text } as Part;
    case "tool":
      return {
        ...base,
        type: "tool",
        tool: part.toolName,
        callID: part.callId,
      } as Part;
    case "file":
      return {
        ...base,
        type: "file",
        filename: part.path,
        mime: part.mimeType,
        url: part.url ?? part.path,
      } as Part;
    case "diff":
      return {
        ...base,
        type: "patch",
        file: part.path,
        patch: part.patch,
      } as unknown as Part;
    case "subtask":
      return {
        ...base,
        type: "subtask",
        description: part.description,
      } as Part;
    case "compaction":
      return {
        ...base,
        type: "compaction",
        auto: part.summary,
      } as unknown as Part;
    case "step-start":
      return { ...base, type: "step-start", snapshot: part.snapshot } as Part;
    case "step-finish":
      return {
        ...base,
        type: "step-finish",
        reason: part.reason,
        cost: part.cost,
        tokens: part.tokens,
      } as Part;
    case "snapshot":
      return { ...base, type: "snapshot", snapshot: part.snapshot } as Part;
    case "agent":
      return { ...base, type: "agent", name: part.name } as Part;
    case "retry":
      return {
        ...base,
        type: "retry",
        attempt: part.attempt,
        error: part.error,
      } as Part;
    case "unknown":
      return { ...base, type: part.providerType } as Part;
  }
  return { ...base, type: "unknown" } as unknown as Part;
}

export function toOpenCodeMessage(
  message: ChatMessage,
): OpenCodeMessageWithParts {
  const raw = asRecord(message.metadata?.raw);
  const rawTime = asRecord(raw.time);
  const time = {
    ...rawTime,
    created: timestamp(message.createdAt),
    ...(message.updatedAt ? { completed: timestamp(message.updatedAt) } : {}),
  };

  return {
    info: {
      ...raw,
      id: message.id,
      sessionID: message.sessionId,
      role: message.role,
      time,
    } as OpencodeMessage,
    parts: message.parts.map((part) =>
      toOpenCodePart(part, message.sessionId, message.id),
    ),
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
      const partRecord = asRecord(part);
      return {
        type: "message.part.updated",
        sessionId: stringValue(partRecord.sessionID, sessionId),
        messageId: stringValue(partRecord.messageID, ""),
        part: mapPart(part as Part),
      };
    }
    case "message.updated": {
      const info = properties.info;
      if (!info || typeof info !== "object") return undefined;
      const message = toChatMessage(info as OpencodeMessage);
      return {
        type: "message.updated",
        sessionId: message.sessionId || sessionId,
        message,
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
