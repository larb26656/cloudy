import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProviderQuestionRequest } from "@repo/contracts";
import { providerApi } from "@/lib/cloudy/provider";
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

export function useQuestions({ directory }: { directory: string }) {
  return useQuery({
    queryKey: questionKeys.list(directory),
    queryFn: async (): Promise<QuestionRequest[]> =>
      (
        await json<ProviderQuestionRequest[]>(
          await providerApi.questions(directory),
        )
      ).map(toQuestion),
    enabled: !!directory,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useSessionQuestions({ sessionID }: { sessionID: string }) {
  return useQuery({
    queryKey: questionKeys.list(sessionID),
    queryFn: async (): Promise<QuestionRequest[]> =>
      (
        await json<ProviderQuestionRequest[]>(
          await providerApi.questions(undefined, sessionID),
        )
      ).map(toQuestion),
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
      void directory;
      const response = await providerApi.interaction({
        kind: "question",
        sessionId: "",
        interactionId: requestID,
        value: answers,
      });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: (_, variables) =>
      void queryClient.invalidateQueries({
        queryKey: questionKeys.list(variables.directory),
      }),
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
      void directory;
      const response = await providerApi.interaction({
        kind: "question",
        interactionId: requestID,
        value: { reject: true },
      });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: (_, variables) =>
      void queryClient.invalidateQueries({
        queryKey: questionKeys.list(variables.directory),
      }),
  });
}
