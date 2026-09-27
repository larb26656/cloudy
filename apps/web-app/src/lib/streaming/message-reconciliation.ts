import type { ChatMessage, MessagePart } from "@repo/contracts";

export type FreshnessResult = "remote" | "streaming" | "neither";

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

export function mergeMessages(
  remote: ChatMessage[],
  streaming: Iterable<ChatMessage>,
) {
  const messages = new Map(remote.map((message) => [message.id, message]));
  for (const message of streaming) {
    const current = messages.get(message.id);
    messages.set(
      message.id,
      current
        ? { ...message, parts: mergeParts(current.parts, message.parts) }
        : message,
    );
  }
  return Array.from(messages.values());
}

function mergeParts(remote: MessagePart[], streaming: MessagePart[]) {
  if (!streaming.length) return remote;
  const parts = new Map(remote.map((part) => [part.id, part]));
  for (const part of streaming) parts.set(part.id, part);
  return Array.from(parts.values());
}

function isFinalized(message: ChatMessage) {
  return (
    (message.role === "user" && message.parts.length > 0) ||
    message.updatedAt !== undefined
  );
}

function contentScore(message: ChatMessage) {
  return (
    message.parts.length * 1_000_000 +
    message.parts.reduce(
      (total, part) =>
        total +
        (part.type === "text" || part.type === "reasoning"
          ? part.text.length
          : 0),
      0,
    )
  );
}
