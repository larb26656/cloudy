import type { InfiniteData } from "@tanstack/react-query";
import type { Message } from "@/types";

export function appendStreamingMessages(
  old: InfiniteData<Message[], string | undefined> | undefined,
  newMessages: Message[],
): InfiniteData<Message[], string | undefined> {
  const existingIds = new Set((old?.pages ?? []).flat().map((m) => m.info.id));
  const toAdd = newMessages.filter((m) => !existingIds.has(m.info.id));

  if (toAdd.length === 0) {
    return old ?? { pages: [[]], pageParams: [undefined] };
  }

  if (!old || old.pages.length === 0) {
    return { pages: [toAdd], pageParams: [undefined] };
  }

  const pages = [...old.pages];
  pages[0] = [...pages[0], ...toAdd];
  return { ...old, pages };
}
