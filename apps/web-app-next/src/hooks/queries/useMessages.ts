import {
  getErrorMessage,
  getOcClient,
  messageKeys,
  type SdkError,
} from "@/lib/opencode";
import { encodeCursor } from "@/lib/opencode/cursor";
import type { Message } from "@/types";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const MESSAGES_LIMIT = 5;

export function useMessages({ sessionId }: { sessionId: string }) {
  return useInfiniteQuery({
    queryKey: messageKeys.infinite(sessionId),
    queryFn: async ({ pageParam }): Promise<Message[]> => {
      const oc = getOcClient();
      const result = await oc.session.messages({
        sessionID: sessionId,
        limit: MESSAGES_LIMIT,
        before: pageParam ?? undefined,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getPreviousPageParam: (firstPage: Message[]) => {
      if (firstPage.length === 0) return undefined;
      const firstMsg = firstPage[0];
      return encodeCursor({
        id: firstMsg.info.id,
        time: firstMsg.info.time.created,
      });
    },
    getNextPageParam: () => undefined,
    enabled: !!sessionId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
      directory,
    }: {
      sessionId: string;
      content: string;
      directory?: string;
    }) => {
      const oc = getOcClient();
      const result = await oc.session.promptAsync({
        sessionID: sessionId,
        parts: [{ type: "text" as const, text: content }],
        directory,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result;
    },
    // onSuccess: (_, variables) => {
    //   // TODO make event handle this
    //   queryClient.invalidateQueries({
    //     queryKey: messageKeys.infinite(variables.sessionId),
    //   });
    // },
  });
}

export function useAbortGeneration() {
  throw new Error("useAbortGeneration: not implemented (M4 wire-up).");
}
