import type * as acp from "@agentclientprotocol/sdk";
import type { ChatMessage, MessagePart } from "@repo/ai-core";

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
      const status =
        update.status === "in_progress"
          ? "running"
          : (update.status ?? tool?.status);
      addPart(message, {
        id: partId,
        type: "tool",
        toolName:
          update.sessionUpdate === "tool_call"
            ? (update.name ?? tool?.toolName ?? undefined)
            : tool?.toolName,
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
