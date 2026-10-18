import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import type { ChatMessage, ModelInfo } from "@repo/contracts";
import { sessionApi } from "@/lib/cloudy/provider";
import {
  messageKeys,
  type ChatInputContent,
  buildPromptParts,
} from "@/lib/opencode";
import type { Message, SessionRunStatus } from "@/types";

const MESSAGES_LIMIT = 50;

type MessagePage = { messages: Message[]; nextCursor?: string };

export function getNextMessageCursor(page: MessagePage): string | undefined {
  return page.nextCursor;
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export function useMessages({
  sessionId,
}: {
  sessionId: string;
  statusType?: SessionRunStatus["type"];
}) {
  return useInfiniteQuery({
    queryKey: messageKeys.infinite(sessionId),
    queryFn: async ({ pageParam }): Promise<MessagePage> => {
      const result = await json<{
        messages: ChatMessage[];
        nextCursor?: string;
      }>(await sessionApi.messages(sessionId, MESSAGES_LIMIT, pageParam));
      return { messages: result.messages, nextCursor: result.nextCursor };
    },
    initialPageParam: undefined as string | undefined,
    getPreviousPageParam: undefined,
    getNextPageParam: getNextMessageCursor,
    select: (data) => ({ ...data, pages: [...data.pages].reverse() }),
    enabled: !!sessionId,
  });
}

export const buildParts = buildPromptParts;

export function useSendMessage() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
      directory,
      providerId,
      model,
      agent,
    }: {
      sessionId: string;
      content: ChatInputContent;
      directory: string;
      providerId: string;
      model?: ModelInfo | null;
      agent?: string | null;
    }) =>
      json(
        await sessionApi.sendMessage(sessionId, {
          directory,
          providerId,
          content: content.text,
          attachments: content.attachments.map((attachment) => ({
            name: attachment.filename,
            mimeType: attachment.mime,
            data: attachment.dataUrl,
          })),
          model: model
            ? {
                providerId: model.providerId,
                modelId: model.modelId,
                variantId: model.variantId,
              }
            : undefined,
          agentId: agent ?? undefined,
        }),
      ),
  });
}

export function useAbortGeneration() {
  return useMutation({
    mutationFn: async ({
      sessionId,
    }: {
      sessionId: string;
      directory: string;
    }) => {
      const response = await sessionApi.abort(sessionId);
      if (!response.ok) throw new Error(await response.text());
    },
  });
}
