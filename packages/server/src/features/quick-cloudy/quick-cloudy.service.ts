import type { AgentsService } from "../settings/agents/settings.agents.service";
import type { SessionsService } from "../sessions/sessions.service";
import type { QuickCloudyQuery } from "./quick-cloudy.model";

export function createQuickCloudyService(
  agentsService: AgentsService,
  sessionsService: SessionsService,
) {
  return {
    getSuggestions(query: QuickCloudyQuery) {
      return {
        agents: agentsService
          .getAgents()
          .agents.filter((agent) => !agent.builtIn),
        recentSessions: sessionsService.list({
          limit: query.limit,
          search: query.search,
        }),
      };
    },
  };
}

export type QuickCloudyService = ReturnType<typeof createQuickCloudyService>;
