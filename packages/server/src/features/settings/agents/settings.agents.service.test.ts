import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadFileConfig } from "../../../config/file-loader";
import type { AppConfig } from "../../../config";
import { createAgentsService } from "./settings.agents.service";

const config: AppConfig = {
  dbPath: "/tmp/cloudy-test.db",
  ui: false,
  host: "localhost",
  port: 4122,
  cors: undefined,
  opencodeApiBase: "http://localhost:4096",
  providers: {
    instances: [],
    opencode: {
      id: "opencode",
      name: "OpenCode",
      templateId: "opencode",
      enabled: true,
      baseUrl: "http://localhost:4096",
    },
  },
  llm: { connections: [] },
  agents: [],
  tempWorkspaceDir: "/tmp/workspaces",
  extensionWorkspaceDir: "/tmp/extensions",
};

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0))
    rmSync(tempDir, { recursive: true });
});

describe("agents service", () => {
  it("always includes the built-in ask agent without a system prompt", () => {
    const service = createAgentsService({ ...config, agents: [] });

    expect(service.getAgents().agents[0]).toEqual({
      id: "ask",
      name: "Ask",
      builtIn: true,
    });
    expect(() =>
      service.createAgent({ name: "ASK", systemPrompt: "Custom prompt" }),
    ).toThrow("Agent already exists: ASK");
  });

  it("does not allow modifying or deleting the built-in ask agent", () => {
    const service = createAgentsService({ ...config, agents: [] });

    expect(() =>
      service.updateAgent("ask", { systemPrompt: "Custom prompt" }),
    ).toThrow("Cannot modify built-in agent: ask");
    expect(() => service.deleteAgent("ask")).toThrow(
      "Cannot delete built-in agent: ask",
    );
    expect(service.getAgents().agents).toEqual([
      { id: "ask", name: "Ask", builtIn: true },
    ]);
  });

  it("creates, updates, and deletes agents in config.json", () => {
    const configDir = mkdtempSync(path.join(tmpdir(), "cloudy-agents-"));
    tempDirs.push(configDir);
    const service = createAgentsService({ ...config, agents: [] }, configDir);

    const agent = service.createAgent({
      name: "Writer",
      systemPrompt: "Write clearly",
      avatar: {
        shape: "orb",
        color: "sky",
        eyes: "awake",
        headwear: "none",
        facewear: "none",
        faceDecoration: "none",
        ambient: "none",
      },
    });
    expect(loadFileConfig(configDir)).toMatchObject({
      agents: [
        {
          id: agent.id,
          name: "Writer",
          systemPrompt: "Write clearly",
          avatar: { color: "sky" },
        },
      ],
    });

    service.updateAgent(agent.id, {
      systemPrompt: "Write concisely",
      avatar: { ...agent.avatar!, color: "violet" },
    });
    expect(service.getAgents().agents[1]?.systemPrompt).toBe("Write concisely");
    expect(service.getAgents().agents[1]?.avatar?.color).toBe("violet");

    service.deleteAgent(agent.id);
    expect(service.getAgents().agents).toEqual([
      { id: "ask", name: "Ask", builtIn: true },
    ]);
  });

  it("returns the configured agents and preserves unrelated config values", () => {
    const configDir = mkdtempSync(path.join(tmpdir(), "cloudy-agents-"));
    tempDirs.push(configDir);
    const service = createAgentsService(
      {
        ...config,
        agents: [{ id: "existing", name: "Editor", systemPrompt: "Edit" }],
      },
      configDir,
    );

    expect(service.getAgents()).toEqual({
      agents: [
        { id: "ask", name: "Ask", builtIn: true },
        {
          id: "existing",
          name: "Editor",
          systemPrompt: "Edit",
          builtIn: false,
        },
      ],
    });
    service.createAgent({ name: "Writer", systemPrompt: "Write" });

    expect(loadFileConfig(configDir)).toMatchObject({
      agents: [
        { id: "existing", name: "Editor", systemPrompt: "Edit" },
        { name: "Writer", systemPrompt: "Write" },
      ],
    });
    expect(loadFileConfig(configDir)).toHaveProperty("host", "localhost");
  });

  it("rejects duplicate names case-insensitively without changing state", () => {
    const agents = [{ id: "one", name: "Writer", systemPrompt: "Write" }];
    const service = createAgentsService(
      { ...config, agents },
      "/tmp/cloudy-agents-duplicate",
    );

    expect(() =>
      service.createAgent({ name: "writer", systemPrompt: "Other" }),
    ).toThrow("Agent already exists: writer");
    expect(agents).toEqual([
      { id: "one", name: "Writer", systemPrompt: "Write" },
    ]);
  });

  it("rejects missing agents and duplicate names during updates", () => {
    const agents = [
      { id: "one", name: "Writer", systemPrompt: "Write" },
      { id: "two", name: "Editor", systemPrompt: "Edit" },
    ];
    const service = createAgentsService(
      { ...config, agents },
      "/tmp/cloudy-agents-update",
    );

    expect(() => service.updateAgent("missing", { name: "Other" })).toThrow(
      "Agent not found: missing",
    );
    expect(() => service.updateAgent("one", { name: "EDITOR" })).toThrow(
      "Agent already exists: EDITOR",
    );
    expect(agents.map(({ name }) => name)).toEqual(["Writer", "Editor"]);
  });

  it("rejects deleting a missing agent without changing state", () => {
    const agents = [{ id: "one", name: "Writer", systemPrompt: "Write" }];
    const service = createAgentsService(
      { ...config, agents },
      "/tmp/cloudy-agents-delete",
    );

    expect(() => service.deleteAgent("missing")).toThrow(
      "Agent not found: missing",
    );
    expect(agents).toHaveLength(1);
  });

  it("does not mutate in-memory agents when persistence fails", () => {
    const agents = [{ id: "one", name: "Writer", systemPrompt: "Write" }];
    const service = createAgentsService(
      { ...config, agents },
      "/dev/null/cloudy-agents",
    );

    expect(() =>
      service.updateAgent("one", { systemPrompt: "Updated" }),
    ).toThrow();
    expect(agents[0]?.systemPrompt).toBe("Write");
    expect(() => service.deleteAgent("one")).toThrow();
    expect(agents).toHaveLength(1);
    expect(() =>
      service.createAgent({ name: "Editor", systemPrompt: "Edit" }),
    ).toThrow();
    expect(agents).toHaveLength(1);
  });
});
