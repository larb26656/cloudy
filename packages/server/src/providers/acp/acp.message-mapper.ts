import type * as acp from "@agentclientprotocol/sdk";
import type { ChatMessage, MessagePart } from "@repo/ai-core";
import { normalizeOtherTool } from "./acp.native-other-tools";

function fileInput(name: string | undefined, value: unknown, hasChanges: boolean): unknown {
  if (!name || !["write", "edit", "apply_patch"].includes(name) ||
      typeof value !== "object" || value === null || Array.isArray(value)) return value;
  const input = { ...value as Record<string, unknown> };
  if (typeof input.path === "string" && input.filePath === undefined) {
    input.filePath = input.path;
    delete input.path;
  }
  if (name === "edit" && hasChanges) {
    delete input.oldString;
    delete input.newString;
  }
  return input;
}

export interface AcpMessageState {
  sessionId: string;
  messages: ChatMessage[];
  currentMessageId?: string;
  turn: number;
  toolParts: Map<string, { messageId: string; partId: string }>;
  currentTextPartId?: string;
}

export type MessageChange =
  | { type: "message"; message: ChatMessage }
  | { type: "part"; messageId: string; part: MessagePart };

export function createAcpMessageState(sessionId: string): AcpMessageState {
  return {
    sessionId,
    messages: [],
    turn: -1,
    toolParts: new Map(),
  };
}

export function startPrompt(
  state: AcpMessageState,
  content: string,
): MessageChange[] {
  const now = new Date().toISOString();
  state.turn++;
  const userId = `acp:${state.sessionId}:${state.turn}:user`;
  const assistantId = `acp:${state.sessionId}:${state.turn}`;
  const user = state.messages.find((message) => message.id === userId) ?? {
    id: userId,
    sessionId: state.sessionId,
    role: "user" as const,
    parts: [],
    createdAt: now,
  };
  const userPart: MessagePart = {
    id: `${userId}:part:0`,
    type: "text",
    text: content,
  };
  const userPartIndex = user.parts.findIndex((part) => part.id === userPart.id);
  if (userPartIndex < 0) user.parts.push(userPart);
  else user.parts[userPartIndex] = userPart;
  const assistant = state.messages.find(
    (message) => message.id === assistantId,
  ) ?? {
    id: assistantId,
    sessionId: state.sessionId,
    role: "assistant" as const,
    parts: [],
    createdAt: now,
  };
  if (!state.messages.includes(user)) state.messages.push(user);
  if (!state.messages.includes(assistant)) state.messages.push(assistant);
  state.currentMessageId = assistant.id;
  state.currentTextPartId = undefined;
  return [
    { type: "message", message: user },
    { type: "message", message: assistant },
  ];
}

export function mapSessionUpdate(
  state: AcpMessageState,
  update: acp.SessionUpdate,
  source: "live" | "load",
): MessageChange[] {
  const changes: MessageChange[] = [];
  const addMessage = (message: ChatMessage) => {
    state.messages.push(message);
    state.currentMessageId = message.id;
    changes.push({ type: "message", message });
    return message;
  };
  const addPart = (message: ChatMessage, part: MessagePart) => {
    const index = message.parts.findIndex(
      (existing) => existing.id === part.id,
    );
    if (index < 0) message.parts.push(part);
    else message.parts[index] = part;
    changes.push({ type: "part", messageId: message.id, part });
  };
  const messageForChunk = (role: "user" | "assistant") => {
    const current = currentMessage(state);
    if (current?.role === role) return current;
    if (role === "user" || state.turn < 0) state.turn++;
    const message = addMessage({
      id: `acp:${state.sessionId}:${state.turn}${role === "user" ? ":user" : ""}`,
      sessionId: state.sessionId,
      role,
      parts: [],
      createdAt: new Date().toISOString(),
    });
    state.currentTextPartId = undefined;
    return message;
  };

  switch (update.sessionUpdate) {
    case "user_message_chunk":
    case "agent_message_chunk":
    case "agent_thought_chunk": {
      if (update.sessionUpdate === "user_message_chunk" && source === "live")
        break;
      const role =
        update.sessionUpdate === "user_message_chunk" ? "user" : "assistant";
      const message = messageForChunk(role);
      const type =
        update.sessionUpdate === "agent_thought_chunk" ? "reasoning" : "text";
      if (update.content.type !== "text") {
        state.currentTextPartId = undefined;
        addPart(message, {
          id: `${message.id}:unknown:${message.parts.length}`,
          type: "unknown",
          providerType: update.content.type,
          data: update,
        });
        break;
      }
      const prior = message.parts.find(
        (part) => part.id === state.currentTextPartId && part.type === type,
      );
      const partId = prior?.id ?? `${message.id}:part:${message.parts.length}`;
      state.currentTextPartId = partId;
      addPart(message, {
        id: partId,
        type,
        text: (prior?.type === type ? prior.text : "") + update.content.text,
      });
      break;
    }
    case "tool_call":
    case "tool_call_update": {
      state.currentTextPartId = undefined;
      const owner = state.toolParts.get(update.toolCallId);
      const current = state.messages.find(
        (item) => item.id === (owner?.messageId ?? state.currentMessageId),
      );
      const message =
        current?.role === "assistant" ? current : messageForChunk("assistant");
      const partId =
        owner?.partId ?? `${message.id}:part:${message.parts.length}`;
      state.toolParts.set(update.toolCallId, { messageId: message.id, partId });
      const previous = message.parts.find((part) => part.id === partId);
      const tool = previous?.type === "tool" ? previous : undefined;
      const raw = { ...(tool?.metadata?.acp as Record<string, unknown> | undefined) };
      for (const [key, value] of Object.entries(update)) {
        if (value !== undefined && !(key === "name" && value === null))
          raw[key] = value;
      }
      const status =
        update.status === "in_progress"
          ? "running"
          : (update.status ?? tool?.status);
      const content = update.content === undefined ? undefined : update.content ?? [];
      const displayContent = content?.flatMap<unknown>((item) =>
        item.type === "content"
          ? [item.content.type === "text" ? item.content.text : item.content]
          : [],
      ) ?? tool?.displayContent;
      const terminalIds = content?.flatMap((item) =>
        item.type === "terminal" ? [item.terminalId] : [],
      ) ?? tool?.terminalIds;
      const changes = content?.flatMap((item) =>
        item.type === "diff"
          ? [{ path: item.path, before: item.oldText ?? undefined, after: item.newText }]
          : [],
      ) ?? tool?.changes;
      const rawOutput = raw.rawOutput;
      const output = rawOutput != null
        ? rawOutput
        : displayContent?.length === 1
          ? displayContent[0]
          : displayContent?.length ? displayContent : undefined;
      const native = normalizeOtherTool(raw.name, raw.rawInput);
      const toolName = native ? native.name : update.name ?? tool?.toolName;
      const rawInput = raw.rawInput;
      let input = native ? native.input : rawInput;
      if ((toolName === "skill" || toolName === "bash") && rawInput != null) {
        if (typeof rawInput === "object" && !Array.isArray(rawInput)) {
          const source = rawInput as Record<string, unknown>;
          const normalized: Record<string, unknown> = {};
          const keys = toolName === "skill"
            ? ["name"]
            : ["command", "description", "workdir"];
          for (const key of keys) {
            if (typeof source[key] === "string") normalized[key] = source[key];
          }
          if (toolName === "bash" && typeof source.timeout === "number")
            normalized.timeout = source.timeout;
          input = normalized;
        } else {
          input = undefined;
        }
      }
      const error = status === "failed" && rawOutput != null &&
        typeof rawOutput === "object" && !Array.isArray(rawOutput) &&
        typeof (rawOutput as Record<string, unknown>).error === "string"
          ? (rawOutput as Record<string, string>).error
          : undefined;
      const hadFileChanges = !!changes?.length || tool?.metadata?.hadFileChanges === true;
      input = fileInput(toolName, input, hadFileChanges);
      addPart(message, {
        id: partId,
        type: "tool",
        toolName,
        callId: update.toolCallId,
        status,
        title: update.title === undefined ? tool?.title : update.title ?? undefined,
        kind: update.kind === undefined ? tool?.kind : update.kind ?? undefined,
        locations: update.locations === undefined
          ? tool?.locations
          : (update.locations ?? []).map((location) => ({
              path: location.path,
              line: location.line ?? undefined,
            })),
        input,
        output,
        error,
        displayContent,
        terminalIds,
        changes,
        metadata: { ...(tool?.metadata ?? {}), ...(hadFileChanges ? { hadFileChanges: true } : {}), acp: raw },
      });
      break;
    }
    case "plan": {
      state.currentTextPartId = undefined;
      const current = currentMessage(state);
      const message =
        current?.role === "assistant" ? current : messageForChunk("assistant");
      addPart(message, {
        id: `${message.id}:plan`,
        type: "tool",
        toolName: "todowrite",
        status: "completed",
        input: {
          content: update.entries.length ? "Todo" : "No todos",
          todos: update.entries,
        },
        metadata: { acp: update },
      });
      break;
    }
    case "session_info_update":
    case "config_option_update":
    case "available_commands_update":
      break;
    default: {
      state.currentTextPartId = undefined;
      const current = currentMessage(state);
      const message =
        current?.role === "assistant" ? current : messageForChunk("assistant");
      addPart(message, {
        id: `${message.id}:unknown:${message.parts.length}`,
        type: "unknown",
        providerType: update.sessionUpdate,
        data: update,
      });
    }
  }
  return changes;
}

export function finishPrompt(
  state: AcpMessageState,
  response: acp.PromptResponse,
  modelId?: string,
): MessageChange[] {
  const message = currentMessage(state);
  if (!message) return [];
  const usage =
    "usage" in response && response.usage && typeof response.usage === "object"
      ? (response.usage as Record<string, unknown>)
      : undefined;
  const tokenCount = (key: string) => {
    const value = usage?.[key];
    return typeof value === "number" ? value : 0;
  };
  message.updatedAt = new Date().toISOString();
  const part: MessagePart = {
    id: `${message.id}:step-finish`,
    type: "step-finish",
    reason: response.stopReason === "end_turn" ? "stop" : response.stopReason,
    modelID: modelId,
    cost: 0,
    tokens: {
      input: tokenCount("inputTokens"),
      output: tokenCount("outputTokens"),
      reasoning: tokenCount("thoughtTokens"),
      cache: {
        read: tokenCount("cachedReadTokens"),
        write: tokenCount("cachedWriteTokens"),
      },
    },
    metadata: {
      provider: "acp",
      stopReason: response.stopReason,
      ...(usage ? { usage } : {}),
    },
  };
  const index = message.parts.findIndex((existing) => existing.id === part.id);
  if (index < 0) message.parts.push(part);
  else message.parts[index] = part;
  return [{ type: "part", messageId: message.id, part }];
}

function currentMessage(state: AcpMessageState) {
  return state.messages.find(
    (message) => message.id === state.currentMessageId,
  );
}
