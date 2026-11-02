import type * as acp from "@agentclientprotocol/sdk";
import type { ChatMessage, MessagePart } from "@repo/ai-core";

export interface AcpMessageState {
  sessionId: string;
  messages: ChatMessage[];
  currentMessageId?: string;
  messageIds: Map<string, string>;
  toolMessageIds: Map<string, string>;
}

export type MessageChange =
  | { type: "message"; message: ChatMessage }
  | { type: "part"; messageId: string; part: MessagePart }
  | { type: "delta"; messageId: string; partId: string; delta: string };

export function createAcpMessageState(sessionId: string): AcpMessageState {
  return {
    sessionId,
    messages: [],
    messageIds: new Map(),
    toolMessageIds: new Map(),
  };
}

export function startPrompt(
  state: AcpMessageState,
  content: string,
  turnId: string,
): MessageChange[] {
  const now = new Date().toISOString();
  state.messageIds.clear();
  state.toolMessageIds.clear();
  const userId = `acp:${state.sessionId}:${turnId}:user`;
  const assistantId = `acp:${state.sessionId}:${turnId}`;
  const user = state.messages.find((message) => message.id === userId) ?? {
    id: userId,
    sessionId: state.sessionId,
    role: "user" as const,
    parts: [],
    createdAt: now,
  };
  const userPart: MessagePart = {
    id: `${userId}:text`,
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
  const messageForChunk = (role: "user" | "assistant", wireId?: string) => {
    if (source === "live" && role === "assistant") {
      const current = currentMessage(state);
      if (current?.role === "assistant") return current;
    }
    const key = wireId && `${role}:${wireId}`;
    const existingId = key && state.messageIds.get(key);
    if (existingId)
      return state.messages.find((message) => message.id === existingId)!;
    const current = currentMessage(state);
    if (current?.role === role && (!wireId || !state.messageIds.size)) {
      if (key) state.messageIds.set(key, current.id);
      return current;
    }
    const message = addMessage({
      id: source === "load" && wireId ? wireId : crypto.randomUUID(),
      sessionId: state.sessionId,
      role,
      parts: [],
      createdAt: new Date().toISOString(),
    });
    if (key) state.messageIds.set(key, message.id);
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
      const message = messageForChunk(role, update.messageId ?? undefined);
      const type =
        update.sessionUpdate === "agent_thought_chunk" ? "reasoning" : "text";
      if (update.content.type !== "text") {
        addPart(message, {
          id: `${message.id}:unknown:${message.parts.length}`,
          type: "unknown",
          providerType: update.content.type,
          data: update,
        });
        break;
      }
      const partId = `${message.id}:${type}`;
      const prior = message.parts.find((part) => part.id === partId);
      addPart(message, {
        id: partId,
        type,
        text: (prior?.type === type ? prior.text : "") + update.content.text,
      });
      if (type === "text")
        changes.push({
          type: "delta",
          messageId: message.id,
          partId,
          delta: update.content.text,
        });
      break;
    }
    case "tool_call":
    case "tool_call_update": {
      const messageId =
        state.toolMessageIds.get(update.toolCallId) ?? state.currentMessageId;
      const current = state.messages.find((item) => item.id === messageId);
      const message =
        current?.role === "assistant" ? current : messageForChunk("assistant");
      state.toolMessageIds.set(update.toolCallId, message.id);
      const partId = `${message.id}:tool:${update.toolCallId}`;
      const previous = message.parts.find((part) => part.id === partId);
      const tool = previous?.type === "tool" ? previous : undefined;
      const status =
        update.status === "in_progress"
          ? "running"
          : (update.status ?? tool?.status ?? "pending");
      addPart(message, {
        id: partId,
        type: "tool",
        toolName:
          update.sessionUpdate === "tool_call"
            ? (update.name ?? "unknown")
            : (tool?.toolName ?? "unknown"),
        callId: update.toolCallId,
        status,
        input: update.rawInput ?? tool?.input,
        output:
          update.rawOutput ??
          (update.content?.length ? update.content : tool?.output),
        metadata: {
          ...(tool?.metadata ?? {}),
          acp: { ...(tool?.metadata?.acp as object | undefined), ...update },
        },
      });
      update.content?.forEach((content, index) => {
        if (content.type !== "diff") return;
        addPart(message, {
          id: `${partId}:diff:${index}`,
          type: "diff",
          path: content.path,
          patch: "",
          before: content.oldText ?? undefined,
          after: content.newText,
        });
      });
      break;
    }
    case "plan": {
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
      break;
    default: {
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
