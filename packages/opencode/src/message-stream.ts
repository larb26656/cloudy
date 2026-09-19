import type {
  GlobalEvent,
  Message as OpencodeMessage,
  Part,
} from "@opencode-ai/sdk/v2";

export interface Message {
  info: OpencodeMessage;
  parts: Part[];
}

export interface MessageStreamState {
  messages: Map<string, Message>;
  pendingDeltas: Map<string, string>;
}

export function createMessageStreamState(): MessageStreamState {
  return { messages: new Map(), pendingDeltas: new Map() };
}

function ensureMessage(
  state: MessageStreamState,
  id: string,
  sessionId: string,
): Message {
  return (
    state.messages.get(id) ?? {
      info: {
        id,
        sessionID: sessionId,
        role: "assistant",
        time: { created: 0 },
      } as Message["info"],
      parts: [],
    }
  );
}

function canAppendDelta(
  part: Part,
): part is Extract<Part, { type: "text" | "reasoning" }> {
  return part.type === "text" || part.type === "reasoning";
}

export function applyMessageInfo(
  state: MessageStreamState,
  message: Message,
): MessageStreamState {
  const existing = state.messages.get(message.info.id);
  const nextMessages = new Map(state.messages);
  nextMessages.set(
    message.info.id,
    existing ? { ...message, parts: existing.parts } : message,
  );
  return { ...state, messages: nextMessages };
}

export function applyMessagePart(
  state: MessageStreamState,
  sessionId: string,
  part: Part,
): MessageStreamState {
  const target = ensureMessage(state, part.messageID, sessionId);
  const pending = state.pendingDeltas.get(part.id);
  const nextPart =
    pending && canAppendDelta(part)
      ? { ...part, text: part.text + pending }
      : part;
  const existingIndex = target.parts.findIndex((item) => item.id === part.id);
  const nextParts =
    existingIndex === -1
      ? [...target.parts, nextPart]
      : target.parts.map((item, index) =>
          index === existingIndex ? nextPart : item,
        );
  const nextMessages = new Map(state.messages);
  nextMessages.set(part.messageID, { ...target, parts: nextParts });
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

export function applyMessageStreamEvent(
  state: MessageStreamState,
  event: GlobalEvent,
  sessionId: string,
): MessageStreamState {
  const payload = event.payload;
  if (payload.type === "message.updated") {
    if (payload.properties.info.sessionID !== sessionId) return state;
    return applyMessageInfo(state, {
      info: payload.properties.info,
      parts: [],
    });
  }
  if (payload.type === "message.part.updated") {
    if (payload.properties.part.sessionID !== sessionId) return state;
    return applyMessagePart(state, sessionId, payload.properties.part);
  }
  if (payload.type === "message.part.delta") {
    if (payload.properties.sessionID !== sessionId) return state;
    return applyMessagePartDelta(
      state,
      payload.properties.messageID,
      payload.properties.partID,
      payload.properties.delta,
    );
  }
  return state;
}
