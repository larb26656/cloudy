import type { ChatEvent, ChatMessage, MessagePart } from "@repo/ai-core";

export interface MessageStreamState {
  messages: Map<string, ChatMessage>;
  pendingDeltas: Map<string, string>;
}

export function createMessageStreamState(): MessageStreamState {
  return { messages: new Map(), pendingDeltas: new Map() };
}

function ensureMessage(
  state: MessageStreamState,
  id: string,
  sessionId: string,
): ChatMessage {
  return (
    state.messages.get(id) ?? {
      id,
      sessionId,
      role: "assistant",
      parts: [],
      createdAt: new Date(0).toISOString(),
    }
  );
}

function canAppendDelta(
  part: MessagePart,
): part is Extract<MessagePart, { type: "text" | "reasoning" }> {
  return part.type === "text" || part.type === "reasoning";
}

function enrichPart(part: MessagePart, message: ChatMessage): MessagePart {
  if (part.type !== "step-finish") return part;
  const raw = message.metadata?.raw;
  if (!raw || typeof raw !== "object") return part;
  const source = raw as Record<string, unknown>;
  return {
    ...part,
    modelID:
      part.modelID ??
      (typeof source.modelID === "string" ? source.modelID : undefined),
    agent:
      part.agent ??
      (typeof source.agent === "string" ? source.agent : undefined),
  };
}

export function applyMessageInfo(
  state: MessageStreamState,
  message: ChatMessage,
): MessageStreamState {
  const existing = state.messages.get(message.id);
  const nextMessages = new Map(state.messages);
  nextMessages.set(
    message.id,
    existing
      ? {
          ...message,
          parts: existing.parts.map((part) => enrichPart(part, message)),
        }
      : message,
  );
  return { ...state, messages: nextMessages };
}

export function applyMessagePart(
  state: MessageStreamState,
  sessionId: string,
  messageId: string,
  part: MessagePart,
): MessageStreamState {
  const target = ensureMessage(state, messageId, sessionId);
  const pending = state.pendingDeltas.get(part.id);
  const nextPart =
    pending && canAppendDelta(part)
      ? { ...part, text: part.text + pending }
      : part;
  const existingIndex = target.parts.findIndex((item) => item.id === part.id);
  const nextParts =
    existingIndex === -1
      ? [...target.parts, enrichPart(nextPart, target)]
      : target.parts.map((item, index) =>
          index === existingIndex ? enrichPart(nextPart, target) : item,
        );
  const nextMessages = new Map(state.messages);
  nextMessages.set(messageId, { ...target, parts: nextParts });
  const pendingDeltas = new Map(state.pendingDeltas);
  pendingDeltas.delete(part.id);
  return { messages: nextMessages, pendingDeltas };
}

export function applyMessagePartDelta(
  state: MessageStreamState,
  messageId: string,
  partId: string,
  delta: string,
): MessageStreamState {
  const message = state.messages.get(messageId);
  const part = message?.parts.find((item) => item.id === partId);
  if (!part) {
    const pendingDeltas = new Map(state.pendingDeltas);
    pendingDeltas.set(partId, (pendingDeltas.get(partId) ?? "") + delta);
    return { ...state, pendingDeltas };
  }
  if (!canAppendDelta(part)) return state;

  const nextMessages = new Map(state.messages);
  const currentMessage = message;
  if (!currentMessage) return state;
  nextMessages.set(messageId, {
    ...currentMessage,
    parts: currentMessage.parts.map((item) => {
      if (item.id !== partId || !canAppendDelta(item)) return item;
      return { ...item, text: item.text + delta };
    }),
  });
  return { ...state, messages: nextMessages };
}

export function applyChatEvent(
  state: MessageStreamState,
  event: ChatEvent,
  sessionId: string,
): MessageStreamState {
  if (event.sessionId !== sessionId) return state;
  if (event.type === "message.updated") {
    return applyMessageInfo(state, event.message);
  }
  if (event.type === "message.part.updated") {
    return applyMessagePart(state, sessionId, event.messageId, event.part);
  }
  if (event.type === "message.delta") {
    return applyMessagePartDelta(
      state,
      event.messageId,
      event.partId,
      event.delta,
    );
  }
  return state;
}
