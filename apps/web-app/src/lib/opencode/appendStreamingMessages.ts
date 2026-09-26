import type { InfiniteData } from "@tanstack/react-query";
import { mergeMessages } from "@repo/opencode";
import type { ChatMessage } from "@repo/opencode";
import { toCoreMessage, toUiMessage, type Message } from "@/types";

export function appendStreamingMessages(
  old: InfiniteData<Message[], string | undefined> | undefined,
  newMessages: ChatMessage[],
): InfiniteData<Message[], string | undefined> {
  const uiMessages = newMessages.map(toUiMessage);
  if (!old || old.pages.length === 0) {
    if (newMessages.length === 0) {
      return old ?? { pages: [[]], pageParams: [undefined] };
    }
    return { pages: [uiMessages], pageParams: [undefined] };
  }

  const pages = [...old.pages];
  const firstPage = pages[0] ?? [];
  pages[0] = mergeMessages(
    firstPage.map((message) => toCoreMessage(message.info, message.parts)),
    newMessages,
  ).map(toUiMessage);
  return { ...old, pages };
}
