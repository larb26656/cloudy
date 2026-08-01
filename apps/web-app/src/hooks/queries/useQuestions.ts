import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CHAT_POLL_INTERVAL,
  getOcClient,
  getErrorMessage,
  questionKeys,
  type SdkError,
} from "@/lib/opencode";
import type { QuestionV2Request, QuestionAnswer } from "@opencode-ai/sdk/v2";

export function useQuestions({ directory }: { directory: string }) {
  return useQuery({
    queryKey: questionKeys.list(directory),
    queryFn: async (): Promise<QuestionV2Request[]> => {
      const oc = getOcClient();
      const result = await oc.question.list({ directory });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data ?? [];
    },
    enabled: !!directory,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useSessionQuestions({ sessionID }: { sessionID: string }) {
  return useQuery({
    queryKey: questionKeys.list(sessionID),
    queryFn: async (): Promise<QuestionV2Request[]> => {
      const oc = getOcClient();
      const result = await oc.v2.session.question.list({ sessionID });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data.data ?? [];
    },
    enabled: !!sessionID,
  });
}

export function useReplyQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestID,
      answers,
      directory,
    }: {
      requestID: string;
      directory: string;
      answers: Array<QuestionAnswer>;
    }): Promise<void> => {
      const oc = getOcClient();
      const result = await oc.question.reply({
        requestID,
        answers,
        directory,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: questionKeys.list(variables.directory),
      });
    },
  });
}

export function useRejectQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestID,
      directory,
    }: {
      requestID: string;
      directory: string;
    }): Promise<void> => {
      const oc = getOcClient();
      const result = await oc.question.reject({
        requestID,
        directory,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: questionKeys.list(variables.directory),
      });
    },
  });
}
