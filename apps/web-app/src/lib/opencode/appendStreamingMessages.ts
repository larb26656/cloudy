import type { InfiniteData } from "@tanstack/react-query";
import type { Part } from "@opencode-ai/sdk/v2";
import type { Message } from "@/types";

function mergeParts(cacheParts: Part[] | undefined, streamingParts: Part[] | undefined): Part[] {
  if (!streamingParts || streamingParts.length === 0) {
    return cacheParts ?? [];
  }
  if (!cacheParts || cacheParts.length === 0) {
    return streamingParts;
  }
  const byId = new Map<string, Part>();
  for (const p of cacheParts) byId.set(p.id, p);
  for (const p of streamingParts) byId.set(p.id, p);
  return Array.from(byId.values());
}

export function appendStreamingMessages(
  old: InfiniteData<Message[], string | undefined> | undefined,
  newMessages: Message[],
): InfiniteData<Message[], string | undefined> {
  if (!old || old.pages.length === 0) {
    if (newMessages.length === 0) {
      return old ?? { pages: [[]], pageParams: [undefined] };
    }
    return { pages: [newMessages], pageParams: [undefined] };
  }

  const pages = [...old.pages];
  const firstPage = pages[0] ?? [];
  const firstPageById = new Map<string, Message>();
  for (const m of firstPage) firstPageById.set(m.info.id, m);

  for (const streamingMsg of newMessages) {
    const existing = firstPageById.get(streamingMsg.info.id);
    if (existing) {
      const merged: Message = {
        info: streamingMsg.info,
        parts: mergeParts(existing.parts, streamingMsg.parts),
      };
      firstPageById.set(streamingMsg.info.id, merged);
    } else {
      firstPageById.set(streamingMsg.info.id, streamingMsg);
    }
  }

  pages[0] = Array.from(firstPageById.values());
  return { ...old, pages };
}
