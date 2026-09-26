import type { ChatMessage, MessagePart } from "@repo/ai-core";

export type MessageSource = "remote" | "streaming";
export type FreshnessResult = MessageSource | "neither";

export function pickFresher(
  remote: ChatMessage | undefined,
  streaming: ChatMessage | undefined,
): FreshnessResult {
  if (!remote && !streaming) return "neither";
  if (!streaming) return "remote";
  if (!remote) return "streaming";

  if (isFinalized(remote)) return "remote";
  if (isFinalized(streaming)) return "streaming";

  return contentScore(streaming) > contentScore(remote)
    ? "streaming"
    : "remote";
}

export function mergeMessageParts(
  remote: MessagePart[] | undefined,
  streaming: MessagePart[] | undefined,
): MessagePart[] {
  if (!streaming?.length) return remote ?? [];
  if (!remote?.length) return streaming;

  const parts = new Map(remote.map((part) => [part.id, part]));
  for (const part of streaming) parts.set(part.id, part);
  return Array.from(parts.values());
}

export function mergeMessage(
  remote: ChatMessage | undefined,
  streaming: ChatMessage,
): ChatMessage {
  if (!remote) return streaming;
  return {
    ...streaming,
    parts: mergeMessageParts(remote.parts, streaming.parts),
  };
}

export function mergeMessages(
  remote: ChatMessage[],
  streaming: Iterable<ChatMessage>,
): ChatMessage[] {
  const messages = new Map(remote.map((message) => [message.id, message]));
  for (const message of streaming) {
    messages.set(message.id, mergeMessage(messages.get(message.id), message));
  }
  return Array.from(messages.values());
}

export function reconcileMessages(
  remote: ChatMessage[],
  streaming: Iterable<ChatMessage>,
): ChatMessage[] {
  const streamingById = new Map(
    Array.from(streaming, (message) => [message.id, message]),
  );
  const messages = remote.map((message) => {
    const stream = streamingById.get(message.id);
    if (!stream) return message;

    streamingById.delete(message.id);
    if (pickFresher(message, stream) !== "streaming") {
      return message;
    }
    return stream;
  });

  return [...messages, ...streamingById.values()];
}

function isFinalized(message: ChatMessage): boolean {
  return (
    (message.role === "user" && message.parts.length > 0) ||
    message.updatedAt !== undefined
  );
}

function contentScore(message: ChatMessage): number {
  let textLength = 0;
  for (const part of message.parts) {
    if (part.type === "text" || part.type === "reasoning") {
      textLength += part.text.length;
    }
  }
  return message.parts.length * 1_000_000 + textLength;
}
