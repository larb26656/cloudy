import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AppConfig } from "../../../config";
import { updateFileConfig } from "../../../config/file-loader";
import type { AgentConfig } from "../model";

export function createAgentsService(config: AppConfig, configDir?: string) {
  const settingsDir = configDir ?? path.dirname(config.dbPath);
  const agents = config.agents;

  return {
    getAgents() {
      return { agents };
    },
    createAgent(input: Omit<AgentConfig, "id">) {
      if (
        agents.some(
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
      return agent;
    },
    updateAgent(id: string, patch: Partial<Omit<AgentConfig, "id">>) {
      const index = agents.findIndex((agent) => agent.id === id);
      if (index < 0) throw new Error(`Agent not found: ${id}`);
      const updated = { ...agents[index]!, ...patch, id };
      if (
        agents.some(
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
      return updated;
    },
    deleteAgent(id: string) {
      const next = agents.filter((agent) => agent.id !== id);
      if (next.length === agents.length)
        throw new Error(`Agent not found: ${id}`);
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
