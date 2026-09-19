import type { Part } from "@opencode-ai/sdk/v2";
import type { Message } from "./message-stream";

export type MessageSource = "remote" | "streaming";
export type FreshnessResult = MessageSource | "neither";

export function pickFresher(
  remote: Message | undefined,
  streaming: Message | undefined,
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
  remote: Part[] | undefined,
  streaming: Part[] | undefined,
): Part[] {
  if (!streaming?.length) return remote ?? [];
  if (!remote?.length) return streaming;

  const parts = new Map(remote.map((part) => [part.id, part]));
  for (const part of streaming) parts.set(part.id, part);
  return Array.from(parts.values());
}

export function mergeMessage(
  remote: Message | undefined,
  streaming: Message,
): Message {
  if (!remote) return streaming;
  return {
    info: streaming.info,
    parts: mergeMessageParts(remote.parts, streaming.parts),
  };
}

export function mergeMessages(
  remote: Message[],
  streaming: Iterable<Message>,
): Message[] {
  const messages = new Map(remote.map((message) => [message.info.id, message]));
  for (const message of streaming) {
    messages.set(
      message.info.id,
      mergeMessage(messages.get(message.info.id), message),
    );
  }
  return Array.from(messages.values());
}

export function reconcileMessages(
  remote: Message[],
  streaming: Iterable<Message>,
): Message[] {
  const streamingById = new Map(
    Array.from(streaming, (message) => [message.info.id, message]),
  );
  const messages = remote.map((message) => {
    const stream = streamingById.get(message.info.id);
    if (!stream) return message;

    streamingById.delete(message.info.id);
    if (pickFresher(message, stream) !== "streaming") {
      return message;
    }
    return stream;
  });

  return [...messages, ...streamingById.values()];
}

function isFinalized(message: Message): boolean {
  return (
    message.info.role === "user" || message.info.time.completed !== undefined
  );
}

function contentScore(message: Message): number {
  let textLength = 0;
  for (const part of message.parts) {
    if (part.type === "text" || part.type === "reasoning") {
      textLength += part.text.length;
    }
  }
  return message.parts.length * 1_000_000 + textLength;
}
