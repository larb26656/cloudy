import {
  CHAT_POLL_INTERVAL,
  getErrorMessage,
  getOcClient,
  messageKeys,
  type ChatInputContent,
  type SdkError,
  buildPromptParts,
} from "@/lib/opencode";
import { encodeCursor } from "@/lib/opencode/cursor";
import type { Message, ModelConfig } from "@/types";
import { toChatMessage } from "@repo/opencode";
import type { SessionRunStatus } from "@/types";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";

const MESSAGES_LIMIT = 50;

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
      const oc = getOcClient();
      const result = await oc.session.messages({
        sessionID: sessionId,
        limit: MESSAGES_LIMIT,
        before: pageParam,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data.map(({ info, parts }) => toChatMessage(info, parts));
    },
    initialPageParam: undefined,
    getPreviousPageParam: undefined,
    getNextPageParam: (message: Message[]) => {
      if (message.length === 0) return undefined;
      const firstMsg = message[0];

      return encodeCursor({
        id: firstMsg.id,
        time: Date.parse(firstMsg.createdAt),
      });
    },
    select: (data) => ({
      ...data,
      pages: [...data.pages].reverse(),
    }),
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
      model?: ModelConfig | null;
      agent?: string | null;
    }) => {
      const oc = getOcClient();
      const parts = buildPromptParts(directory, content);

      const result = await oc.session.promptAsync({
        sessionID: sessionId,
        parts,
        directory,
        model: model
          ? { providerID: model.providerID, modelID: model.modelID }
          : undefined,
        agent: agent ?? undefined,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result;
    },
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
      const oc = getOcClient();
      const result = await oc.session.abort({
        sessionID: sessionId,
        directory,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result;
    },
  });
}
