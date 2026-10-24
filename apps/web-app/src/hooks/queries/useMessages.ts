import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import type { ChatMessage, ModelInfo } from "@repo/contracts";
import { cloudyClient } from "@/lib/api";
import { emptyResponse, jsonResponse } from "@/lib/api-response";
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

export function useMessages({
  sessionId,
}: {
  sessionId: string;
  statusType?: SessionRunStatus["type"];
}) {
  return useInfiniteQuery({
    queryKey: messageKeys.infinite(sessionId),
    queryFn: async ({ pageParam }): Promise<MessagePage> => {
      const result = await jsonResponse<{
        messages: ChatMessage[];
        nextCursor?: string;
      }>(
        await cloudyClient.api.sessions[":sessionId"].messages.$get({
          param: { sessionId },
          query: { limit: String(MESSAGES_LIMIT), before: pageParam },
        }),
      );
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
      jsonResponse(
        await cloudyClient.api.sessions[":sessionId"].messages.$post({
          param: { sessionId },
          json: {
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
          },
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
      await emptyResponse(
        await cloudyClient.api.sessions[":sessionId"].abort.$post({
          param: { sessionId },
        }),
      );
    },
  });
}
