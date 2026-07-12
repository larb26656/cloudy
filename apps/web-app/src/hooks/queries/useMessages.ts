import {
  getErrorMessage,
  getOcClient,
  messageKeys,
  type ChatInputContent,
  type SdkError,
} from "@/lib/opencode";
import { encodeCursor } from "@/lib/opencode/cursor";
import type { Message } from "@/types";
import type { AgentPartInput, FilePartInput, SubtaskPartInput, TextPartInput } from "@opencode-ai/sdk/v2/types";
import {
  useInfiniteQuery,
  useMutation,
} from "@tanstack/react-query";

const MESSAGES_LIMIT = 50;

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
      console.log(firstMsg);
      return encodeCursor({
        id: firstMsg.info.id,
        time: firstMsg.info.time.created,
      });
    },
    getNextPageParam: () => undefined,
    enabled: !!sessionId,
  });
}

export function buildParts(
    directory: string,
    content: ChatInputContent
): (TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput)[] {
    const textPart: TextPartInput = { type: 'text', text: content.text };

    const mentionParts: FilePartInput[] = content.mentions.map((mention) => {
        const filename = mention.id;
        const path = `${directory}/${filename}`;
        const url = `file://${path}`

        return {
            type: 'file',
            mime: 'text/plain',
            url,
            filename,
            source: {
                type: "file",
                text: {
                    value: filename,
                    start: 0,
                    end: filename.length
                },
                path
            }
        };
    }
    );

    return [textPart, ...mentionParts];
}


export function useSendMessage() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
      directory,
    }: {
      sessionId: string;
      content: ChatInputContent,
      directory: string;
    }) => {
      const oc = getOcClient();
      const parts = buildParts(directory, content);

      const result = await oc.session.promptAsync({
        sessionID: sessionId,
        parts,
        directory,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result;
    },
  });
}

export function useAbortGeneration() {
  throw new Error("useAbortGeneration: not implemented (M4 wire-up).");
}
