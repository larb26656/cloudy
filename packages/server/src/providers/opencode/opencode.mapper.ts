import type {
  AgentInfo,
  ChatEvent,
  ChatMessage,
  MessagePart,
  ModelInfo,
  ProviderInfo,
  RunStatus,
  SessionStatus,
  ChatSession,
  PermissionRequest,
  ProviderQuestionRequest,
} from "@repo/ai-core";
import type {
  Agent,
  AgentV2Info,
  GlobalEvent,
  Message as OpencodeMessage,
  Model,
  Part,
  Provider,
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

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function mapStatus(value: unknown): RunStatus {
  if (value === "running" || value === "busy") return "running";
  if (value === "completed" || value === "idle") return "completed";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  if (value === "failed" || value === "error") return "failed";
  return "queued";
}

function mapSessionStatus(value: unknown): SessionStatus {
  if (value === "active" || value === "busy") return "active";
  if (value === "paused" || value === "retry") return "paused";
  if (value === "closed") return "closed";
  return "idle";
}

function createdAt(info: OpencodeMessage): string {
  const created = asRecord(info.time).created;
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

export function mapOpenCodePart(part: Part): MessagePart {
  const source = asRecord(part);
  const base = {
    id: stringValue(source.id, "unknown-part"),
    metadata: { provider: "opencode", raw: source },
  };

  switch (source.type) {
    case "text":
      return { ...base, type: "text", text: stringValue(source.text, "") };
    case "reasoning": {
      const time = asRecord(source.time);
      return {
        ...base,
        type: "reasoning",
        text: stringValue(source.text, ""),
        startedAt: typeof time.start === "number" ? time.start : undefined,
        completedAt: typeof time.end === "number" ? time.end : undefined,
      };
    }
    case "tool": {
      const state = asRecord(source.state);
      const time = asRecord(state.time);
      return {
        ...base,
        type: "tool",
        toolName: stringValue(source.tool, "unknown"),
        callId: typeof source.callID === "string" ? source.callID : undefined,
        status:
          state.status === "running" ||
          state.status === "completed" ||
          state.status === "error"
            ? state.status === "error"
              ? "failed"
              : state.status
            : "pending",
        input: state.input,
        output: state.output,
        error: typeof state.error === "string" ? state.error : undefined,
        state: {
          status:
            state.status === "running" ||
            state.status === "completed" ||
            state.status === "error"
              ? state.status === "error"
                ? "error"
                : state.status
              : "pending",
          input: asRecord(state.input),
          output: state.output,
          error: typeof state.error === "string" ? state.error : undefined,
          startedAt: typeof time.start === "number" ? time.start : undefined,
          completedAt: typeof time.end === "number" ? time.end : undefined,
        },
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
    case "patch": {
      const files = stringArray(source.files);
      return {
        ...base,
        type: "diff",
        path: stringValue(source.file, files?.[0] ?? "unknown"),
        patch: stringValue(source.patch, ""),
        hash: typeof source.hash === "string" ? source.hash : undefined,
        files,
      };
    }
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
      return {
        ...base,
        type: "unknown",
        providerType:
          typeof source.type === "string" && source.type.length > 0
            ? source.type
            : "<missing>",
        data: source,
      };
  }
}

export function toChatMessage(
  info: OpencodeMessage,
  parts: Part[] = [],
): ChatMessage {
  const source = asRecord(info);
  const modelID =
    typeof source.modelID === "string" ? source.modelID : undefined;
  const agent = typeof source.agent === "string" ? source.agent : undefined;
  return {
    id: info.id,
    sessionId: stringValue(info.sessionID, ""),
    role: info.role === "user" ? "user" : "assistant",
    parts: parts.map(mapOpenCodePart).map((part) =>
      part.type === "step-finish"
        ? {
            ...part,
            modelID: part.modelID ?? modelID,
            agent: part.agent ?? agent,
          }
        : part,
    ),
    createdAt: createdAt(info),
    updatedAt: updatedAt(info),
    metadata: { provider: "opencode", raw: info },
  };
}

export function toChatSession(
  value: unknown,
  providerId = "opencode",
): ChatSession {
  const source = asRecord(value);
  const time = asRecord(source.time);
  const updated = typeof time.updated === "number" ? time.updated : Date.now();
  const created = typeof time.created === "number" ? time.created : updated;
  return {
    id: stringValue(source.id, ""),
    title: typeof source.title === "string" ? source.title : undefined,
    status: "idle",
    runStatus: "idle",
    providerId,
    directory:
      typeof source.directory === "string" ? source.directory : undefined,
    parentId: typeof source.parentID === "string" ? source.parentID : undefined,
    createdAt: new Date(created).toISOString(),
    updatedAt: new Date(updated).toISOString(),
    cost: typeof source.cost === "number" ? source.cost : undefined,
    tokens: asRecord(source.tokens) as ChatSession["tokens"],
    metadata: { provider: providerId, raw: value },
  };
}

export function toPermissionRequest(value: unknown): PermissionRequest {
  const source = asRecord(value);
  const tool = asRecord(source.tool);
  return {
    id: stringValue(source.id, ""),
    sessionId: stringValue(source.sessionID, ""),
    permission: stringValue(source.permission, "unknown"),
    patterns: Array.isArray(source.patterns)
      ? source.patterns.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    always: Array.isArray(source.always)
      ? source.always.filter((item): item is string => typeof item === "string")
      : undefined,
    tool:
      typeof tool.messageID === "string"
        ? { messageId: tool.messageID }
        : undefined,
    metadata: { provider: "opencode", raw: value },
  };
}

export function toQuestionRequest(value: unknown): ProviderQuestionRequest {
  const source = asRecord(value);
  const questions = Array.isArray(source.questions) ? source.questions : [];
  return {
    id: stringValue(source.id, ""),
    sessionId: stringValue(source.sessionID, ""),
    questions: questions.map((item) => {
      const question = asRecord(item);
      const options = Array.isArray(question.options) ? question.options : [];
      return {
        header: stringValue(question.header, ""),
        question: stringValue(question.question, ""),
        multiple: question.multiple === true,
        options: options.map((option) => {
          const entry = asRecord(option);
          return {
            label: stringValue(entry.label, ""),
            description:
              typeof entry.description === "string"
                ? entry.description
                : undefined,
          };
        }),
      };
    }),
    metadata: { provider: "opencode", raw: value },
  };
}

export function toChatEvent(event: GlobalEvent): ChatEvent | undefined {
  const payload = asRecord(event.payload);
  const properties = asRecord(payload.properties);
  const sessionId = stringValue(properties.sessionID, "");
  const directory = event.directory;

  switch (payload.type) {
    case "message.part.delta":
      return {
        type: "message.delta",
        directory,
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
        directory,
        sessionId: stringValue(partRecord.sessionID, sessionId),
        messageId: stringValue(partRecord.messageID, ""),
        part: mapOpenCodePart(part as Part),
      };
    }
    case "message.updated": {
      const info = properties.info;
      if (!info || typeof info !== "object") return undefined;
      const message = toChatMessage(info as OpencodeMessage);
      return {
        type: "message.updated",
        directory,
        sessionId: message.sessionId || sessionId,
        message,
      };
    }
    case "session.status": {
      const status = asRecord(properties.status);
      return {
        type: "session.status",
        directory,
        sessionId,
        status: mapSessionStatus(status.type),
        runStatus: mapStatus(status.type),
      };
    }
    case "session.idle":
      return {
        type: "session.status",
        directory,
        sessionId,
        status: "idle",
        runStatus: "completed",
      };
    case "session.error": {
      const error = properties.error;
      const errorRecord = asRecord(error);
      const errorData = asRecord(errorRecord.data);
      return {
        type: "run.failed",
        directory,
        sessionId,
        message:
          typeof errorRecord.message === "string"
            ? errorRecord.message
            : typeof errorData.message === "string"
              ? errorData.message
              : undefined,
        error,
      };
    }
    case "permission.asked":
      return {
        type: "approval.requested",
        directory,
        sessionId,
        request: toPermissionRequest(properties),
      };
    case "question.asked":
      return {
        type: "question.requested",
        directory,
        sessionId,
        request: toQuestionRequest(properties),
      };
    default:
      return undefined;
  }
}

export function toModelInfo(providerId: string, model: Model): ModelInfo {
  return {
    providerId,
    modelId: model.id,
    name: model.name,
    capabilities: {
      streaming: true,
      tools: model.capabilities.toolcall,
      reasoning: model.capabilities.reasoning,
      vision: model.capabilities.input.image,
      attachments: model.capabilities.attachment,
      maxInputTokens: model.limit.input,
      maxOutputTokens: model.limit.output,
    },
    metadata: { provider: "opencode", status: model.status },
  };
}

export function toAgentInfo(agent: Agent | AgentV2Info): AgentInfo {
  const name = "name" in agent ? agent.name : agent.id;
  return {
    id: name,
    name,
    description: agent.description,
    mode: agent.mode,
    native: "native" in agent ? agent.native : undefined,
    hidden: agent.hidden,
    metadata: { provider: "opencode" },
  };
}

export function toProviderInfo(
  provider: Provider,
  agents: Agent[],
): ProviderInfo {
  return {
    id: provider.id,
    name: provider.name,
    capabilities: {
      streaming: true,
      attachments: Object.values(provider.models).some(
        (model) => model.capabilities.attachment,
      ),
      tools: Object.values(provider.models).some(
        (model) => model.capabilities.toolcall,
      ),
      reasoning: Object.values(provider.models).some(
        (model) => model.capabilities.reasoning,
      ),
      models: true,
      agents: agents.length > 0,
    },
    models: Object.values(provider.models).map((model) =>
      toModelInfo(provider.id, model),
    ),
    agents: agents.map(toAgentInfo),
    metadata: { source: provider.source },
  };
}
