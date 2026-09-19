import type { InfiniteData } from "@tanstack/react-query";
import { mergeMessages } from "@repo/opencode";
import type { Message } from "@/types";

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
  pages[0] = mergeMessages(firstPage, newMessages);
  return { ...old, pages };
}
