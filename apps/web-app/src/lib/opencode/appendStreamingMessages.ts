import type { InfiniteData } from "@tanstack/react-query";
import { mergeMessages } from "@/lib/streaming/message-reconciliation";
import type { ChatMessage } from "@repo/contracts";
import type { Message } from "@/types";

type MessagePage = { messages: Message[]; nextCursor?: string };

export function appendStreamingMessages(
  old: InfiniteData<MessagePage, string | undefined> | undefined,
  newMessages: ChatMessage[],
): InfiniteData<MessagePage, string | undefined> {
  if (!old || old.pages.length === 0) {
    if (newMessages.length === 0) {
      return old ?? { pages: [{ messages: [] }], pageParams: [undefined] };
    }
    return {
      pages: [{ messages: newMessages }],
      pageParams: [undefined],
    };
  }

  const pages = [...old.pages];
  const firstPage = pages[0] ?? { messages: [] };
  pages[0] = {
    ...firstPage,
    messages: mergeMessages(firstPage.messages, newMessages),
  };
  return { ...old, pages };
}
