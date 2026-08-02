import type { Message } from "@/types";

export type MessageSource = "remote" | "streaming";
export type FreshnessResult = MessageSource | "neither";

/**
 * Decide which copy of a message is fresher: the React Query cache ("remote")
 * or the live streaming store ("streaming"). Used by the message list to render
 * the newer of the two so a mid-stream `useMessages` refetch (which can return
 * a partial server snapshot of an assistant message still being generated)
 * never freezes the bubble on stale content.
 *
 * Hybrid strategy:
 *  - only one side present → that side wins
 *  - a finalized copy (assistant with `time.completed`, or any user message)
 *    is authoritative; if both are finalized, remote wins as the durable
 *    source of truth
 *  - if neither is finalized (mid-stream assistant), compare accumulated
 *    content (parts count, then total text) — streaming accumulates faster
 *    than any mid-flight server snapshot, so it wins until the server catches
 *    up; ties break to remote
 */
export function pickFresher(
  remote: Message | undefined,
  streaming: Message | undefined,
): FreshnessResult {
  if (!remote && !streaming) return "neither";
  if (!streaming) return "remote";
  if (!remote) return "streaming";

  if (isFinalized(remote)) return "remote";
  if (isFinalized(streaming)) return "streaming";

  if (contentScore(streaming) > contentScore(remote)) return "streaming";
  return "remote";
}

/** A message is finalized when it can no longer receive streaming updates. */
function isFinalized(message: Message): boolean {
  const info = message.info;
  if (info.role === "user") return true;
  return info.time.completed !== undefined;
}

/**
 * Coarse "how much content has accumulated" score. Parts count dominates (each
 * part outweighs any text length), total text/reasoning length acts as a
 * tiebreaker so a streaming text part that has grown longer than the server
 * snapshot is detected even when part counts match.
 */
function contentScore(message: Message): number {
  let text = 0;
  for (const p of message.parts) {
    if (p.type === "text" || p.type === "reasoning") {
      text += p.text.length;
    }
  }
  return message.parts.length * 1_000_000 + text;
}
