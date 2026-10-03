import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProviderQuestionRequest } from "@repo/contracts";
import { sessionApi } from "@/lib/cloudy/provider";
import { CHAT_POLL_INTERVAL, questionKeys } from "@/lib/opencode";
import type { QuestionAnswer, QuestionRequest } from "@/types";

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

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

export function useSessionQuestions({ sessionId }: { sessionId: string }) {
  return useQuery({
    queryKey: questionKeys.list(sessionId),
    queryFn: async (): Promise<QuestionRequest[]> =>
      (
        await json<ProviderQuestionRequest[]>(
          await sessionApi.questions(sessionId),
        )
      ).map(toQuestion),
    enabled: !!sessionId,
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
      const response = await sessionApi.replyQuestion(
        sessionId,
        requestID,
        answers,
      );
      if (!response.ok) throw new Error(await response.text());
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
      const response = await sessionApi.replyQuestion(sessionId, requestID, {
        reject: true,
      });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: (_, variables) =>
      void queryClient.invalidateQueries({
        queryKey: questionKeys.list(variables.sessionId),
      }),
  });
}
