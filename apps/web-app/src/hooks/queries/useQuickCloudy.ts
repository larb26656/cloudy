import { useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import { cloudyClient } from "@/lib/api";
import type { RecentChatSession } from "@/types";

type SuggestionsResponse = InferResponseType<
  (typeof cloudyClient.api)["quick-cloudy"]["$get"],
  200
>;

export type QuickCloudyAgent = SuggestionsResponse["agents"][number];

export function useQuickCloudySuggestions({
  search,
}: { search?: string } = {}) {
  return useQuery({
    queryKey: ["quick-cloudy", { search }],
    queryFn: async (): Promise<{
      agents: QuickCloudyAgent[];
      recentSessions: RecentChatSession[];
    }> => {
      const response = await cloudyClient.api["quick-cloudy"].$get({
        query: { limit: "5", search },
      });
      if (!response.ok) throw new Error("Failed to load Quick Cloudy items");
      const result: SuggestionsResponse = await response.json();
      return {
        agents: result.agents,
        recentSessions: result.recentSessions.map((session) => ({
          agentId: session.agent?.id,
          id: session.id,
          providerId: session.providerId,
          title: session.title,
          parentID: session.parentId,
          directory: session.directory ?? "",
          status: typeof session.status === "string" ? session.status : "retry",
          runStatus: session.runStatus,
          updatedAt: Date.parse(session.updatedAt),
          cost: session.cost,
          tokens: session.tokens,
        })),
      };
    },
    placeholderData: (previousData) => previousData,
  });
}
