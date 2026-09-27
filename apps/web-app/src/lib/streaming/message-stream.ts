import type { ChatEvent, ChatMessage, MessagePart } from "@repo/contracts";

export interface MessageStreamState {
  messages: Map<string, ChatMessage>;
  pendingDeltas: Map<string, string>;
}

function canAppendDelta(
  part: MessagePart,
): part is Extract<MessagePart, { type: "text" | "reasoning" }> {
  return part.type === "text" || part.type === "reasoning";
}

function ensureMessage(
  state: MessageStreamState,
  id: string,
  sessionId: string,
) {
  return (
    state.messages.get(id) ?? {
      id,
      sessionId,
      role: "assistant" as const,
      parts: [],
      createdAt: new Date(0).toISOString(),
    }
  );
}

export function applyMessageInfo(
  state: MessageStreamState,
  message: ChatMessage,
) {
  const nextMessages = new Map(state.messages);
  const existing = state.messages.get(message.id);
  nextMessages.set(
    message.id,
    existing ? { ...message, parts: existing.parts } : message,
  );
  return { ...state, messages: nextMessages };
}

export function applyMessagePart(
  state: MessageStreamState,
  sessionId: string,
  messageId: string,
  part: MessagePart,
) {
  const target = ensureMessage(state, messageId, sessionId);
  const pending = state.pendingDeltas.get(part.id);
  const nextPart =
    pending && canAppendDelta(part)
      ? { ...part, text: part.text + pending }
      : part;
  const index = target.parts.findIndex((item) => item.id === part.id);
  const parts =
    index === -1
      ? [...target.parts, nextPart]
      : target.parts.map((item, itemIndex) =>
          itemIndex === index ? nextPart : item,
        );
  const messages = new Map(state.messages);
  messages.set(messageId, { ...target, parts });
  const pendingDeltas = new Map(state.pendingDeltas);
  pendingDeltas.delete(part.id);
  return { messages, pendingDeltas };
}

export function applyMessagePartDelta(
  state: MessageStreamState,
  messageId: string,
  partId: string,
  delta: string,
) {
  const message = state.messages.get(messageId);
  const part = message?.parts.find((item) => item.id === partId);
  if (!part) {
    const pendingDeltas = new Map(state.pendingDeltas);
    pendingDeltas.set(partId, (pendingDeltas.get(partId) ?? "") + delta);
    return { ...state, pendingDeltas };
  }
  if (!canAppendDelta(part) || !message) return state;
  const messages = new Map(state.messages);
  messages.set(messageId, {
    ...message,
    parts: message.parts.map((item) =>
      item.id === partId && canAppendDelta(item)
        ? { ...item, text: item.text + delta }
        : item,
    ),
  });
  return { ...state, messages };
}

export function applyChatEvent(
  state: MessageStreamState,
  event: ChatEvent,
  sessionId: string,
) {
  if (event.sessionId !== sessionId) return state;
  if (event.type === "message.updated")
    return applyMessageInfo(state, event.message);
  if (event.type === "message.part.updated")
    return applyMessagePart(state, sessionId, event.messageId, event.part);
  if (event.type === "message.delta")
    return applyMessagePartDelta(
      state,
      event.messageId,
      event.partId,
      event.delta,
    );
  return state;
}
