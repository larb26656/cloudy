import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import type { ChatMessage, ModelInfo } from "@repo/contracts";
import { providerApi } from "@/lib/cloudy/provider";
import {
  CHAT_POLL_INTERVAL,
  messageKeys,
  type ChatInputContent,
  buildPromptParts,
} from "@/lib/opencode";
import { encodeCursor } from "@/lib/opencode/cursor";
import type { Message, SessionRunStatus } from "@/types";

const MESSAGES_LIMIT = 50;

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export function useMessages({
  sessionId,
  statusType,
}: {
  sessionId: string;
  statusType?: SessionRunStatus["type"];
}) {
  return useInfiniteQuery({
    queryKey: messageKeys.infinite(sessionId),
    queryFn: async ({ pageParam }): Promise<Message[]> => {
      const result = await json<{ messages: ChatMessage[] }>(
        await providerApi.messages(sessionId, MESSAGES_LIMIT, pageParam),
      );
      return result.messages;
    },
    initialPageParam: undefined as string | undefined,
    getPreviousPageParam: undefined,
    getNextPageParam: (message: Message[]) => {
      if (message.length === 0) return undefined;
      const firstMsg = message[0];
      return encodeCursor({
        id: firstMsg.id,
        time: Date.parse(firstMsg.createdAt),
      });
    },
    select: (data) => ({ ...data, pages: [...data.pages].reverse() }),
    enabled: !!sessionId,
    refetchInterval:
      statusType === "busy" || statusType === "retry"
        ? false
        : CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export const buildParts = buildPromptParts;

export function useSendMessage() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
      directory,
      model,
      agent,
    }: {
      sessionId: string;
      content: ChatInputContent;
      directory: string;
      model?: ModelInfo | null;
      agent?: string | null;
    }) =>
      json(
        await providerApi.sendMessage({
          sessionId,
          directory,
          content: content.text,
          attachments: content.attachments.map((attachment) => ({
            name: attachment.filename,
            mimeType: attachment.mime,
            data: attachment.dataUrl,
          })),
          model: model
            ? { providerId: model.providerId, modelId: model.modelId }
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
      directory,
    }: {
      sessionId: string;
      directory: string;
    }) => {
      const response = await providerApi.abort(sessionId, directory);
      if (!response.ok) throw new Error(await response.text());
    },
  });
}
