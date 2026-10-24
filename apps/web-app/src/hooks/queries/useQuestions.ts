import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProviderQuestionRequest } from "@repo/contracts";
import { cloudyClient } from "@/lib/api";
import { jsonResponse } from "@/lib/api-response";
import { CHAT_POLL_INTERVAL, questionKeys } from "@/lib/opencode";
import type { QuestionAnswer, QuestionRequest } from "@/types";

function toQuestion(request: ProviderQuestionRequest): QuestionRequest {
  return {
    id: request.id,
    sessionID: request.sessionId,
    questions: request.questions.map((question) => ({
      ...question,
      multiple: question.multiple ?? false,
    })),
  };
}

export function useSessionQuestions({
  sessionId,
  enabled = true,
}: {
  sessionId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: questionKeys.list(sessionId),
    queryFn: async (): Promise<QuestionRequest[]> =>
      (
        await jsonResponse<ProviderQuestionRequest[]>(
          await cloudyClient.api.sessions[":sessionId"].questions.$get({
            param: { sessionId },
          }),
        )
      ).map(toQuestion),
    enabled: !!sessionId && enabled,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useReplyQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestID,
      sessionId,
      answers,
    }: {
      requestID: string;
      sessionId: string;
      answers: Array<QuestionAnswer>;
    }): Promise<void> => {
      await jsonResponse(
        await cloudyClient.api.sessions[":sessionId"].questions[
          ":questionId"
        ].$post({
          param: { sessionId, questionId: requestID },
          json: { value: answers },
        }),
      );
    },
    onSuccess: (_, variables) =>
      void queryClient.invalidateQueries({
        queryKey: questionKeys.list(variables.sessionId),
      }),
  });
}

export function useRejectQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestID,
      sessionId,
    }: {
      requestID: string;
      sessionId: string;
    }): Promise<void> => {
      await jsonResponse(
        await cloudyClient.api.sessions[":sessionId"].questions[
          ":questionId"
        ].$post({
          param: { sessionId, questionId: requestID },
          json: { value: { reject: true } },
        }),
      );
    },
    onSuccess: (_, variables) =>
      void queryClient.invalidateQueries({
        queryKey: questionKeys.list(variables.sessionId),
      }),
  });
}
