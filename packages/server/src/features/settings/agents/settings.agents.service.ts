import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AppConfig } from "../../../config";
import { updateFileConfig } from "../../../config/file-loader";
import type { AgentConfig } from "../settings.model";

const builtInAskAgent: AgentConfig = {
  id: "ask",
  name: "Ask",
  builtIn: true,
};

export function createAgentsService(config: AppConfig, configDir?: string) {
  const settingsDir = configDir ?? path.dirname(config.dbPath);
  const agents = config.agents;
  const getAllAgents = () => [
    builtInAskAgent,
    ...agents
      .filter((agent) => agent.id !== builtInAskAgent.id)
      .map((agent) => ({ ...agent, builtIn: false })),
  ];
  const findAgentById = (id: string) => {
    const agent = getAllAgents().find((candidate) => candidate.id === id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    return agent;
  };

  return {
    getAgents() {
      return { agents: getAllAgents() };
    },
    createAgent(input: Omit<AgentConfig, "id" | "builtIn">) {
      if (
        getAllAgents().some(
          (agent) => agent.name.toLowerCase() === input.name.toLowerCase(),
        )
      )
        throw new Error(`Agent already exists: ${input.name}`);
      const agent = { ...input, id: randomUUID() };
      const next = [...agents, agent];
      updateFileConfig(settingsDir, (current) => ({
        ...current,
        agents: next,
      }));
      agents.push(agent);
      return { ...agent, builtIn: false };
    },
    updateAgent(
      id: string,
      patch: Partial<Omit<AgentConfig, "id" | "builtIn">>,
    ) {
      const current = findAgentById(id);
      if (current.builtIn)
        throw new Error(`Cannot modify built-in agent: ${id}`);
      const index = agents.findIndex((agent) => agent.id === id);
      const updated = { ...agents[index]!, ...patch, id };
      if (
        getAllAgents().some(
          (agent) =>
            agent.id !== id &&
            agent.name.toLowerCase() === updated.name.toLowerCase(),
        )
      )
        throw new Error(`Agent already exists: ${updated.name}`);
      const next = agents.map((agent) => (agent.id === id ? updated : agent));
      updateFileConfig(settingsDir, (current) => ({
        ...current,
        agents: next,
      }));
      agents[index] = updated;
      return { ...updated, builtIn: false };
    },
    deleteAgent(id: string) {
      const current = findAgentById(id);
      if (current.builtIn)
        throw new Error(`Cannot delete built-in agent: ${id}`);
      const next = agents.filter((agent) => agent.id !== id);
      updateFileConfig(settingsDir, (current) => ({
        ...current,
        agents: next,
      }));
      agents.splice(0, agents.length, ...next);
      return { id };
    },
  };
}

export type AgentsService = ReturnType<typeof createAgentsService>;
