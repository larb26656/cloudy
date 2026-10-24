import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadFileConfig } from "../../../config/file-loader";
import type { AppConfig } from "../../../config";
import type { AgentProviderRegistry } from "../../../providers/provider.registry";
import { createAgentProviderSettingsService } from "./service";

const config: AppConfig = {
  dbPath: "/tmp/cloudy-test.db",
  ui: false,
  host: "localhost",
  port: 4122,
  cors: undefined,
  opencodeApiBase: "http://localhost:4096",
  providers: {
    instances: [
      {
        id: "opencode",
        name: "OpenCode",
        templateId: "opencode",
        enabled: true,
        baseUrl: "http://localhost:4096",
      },
    ],
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

describe("agent provider settings service", () => {
  it("lists compile-time provider templates", () => {
    const service = createAgentProviderSettingsService(
      config,
      "/tmp/cloudy-settings-templates",
    );

    expect(service.getAgentProviderTemplates()).toEqual({
      templates: [
        {
          id: "opencode",
          name: "OpenCode",
          description: "Connect to an OpenCode server.",
        },
      ],
    });
  });

  it("persists provider instance updates", () => {
    const configDir = mkdtempSync(path.join(tmpdir(), "cloudy-settings-"));
    tempDirs.push(configDir);
    const service = createAgentProviderSettingsService(config, configDir);

    const result = service.updateAgentProvider("opencode", {
      enabled: false,
      baseUrl: "http://localhost:5000",
    });

    expect(result).toMatchObject({
      id: "opencode",
      enabled: false,
      baseUrl: "http://localhost:5000",
    });
    expect(loadFileConfig(configDir)).toMatchObject({
      providers: {
        instances: [
          expect.objectContaining({
            id: "opencode",
            enabled: false,
            baseUrl: "http://localhost:5000",
          }),
        ],
      },
    });
    expect(loadFileConfig(configDir)).not.toHaveProperty("opencodeApiBase");
  });

  it("returns configured instances and creates, persists, and deletes instances", () => {
    const configDir = mkdtempSync(path.join(tmpdir(), "cloudy-settings-"));
    tempDirs.push(configDir);
    const service = createAgentProviderSettingsService(
      { ...config, providers: { ...config.providers, instances: [] } },
      configDir,
    );
    expect(service.getAgentProviders()).toEqual({ instances: [] });

    const created = service.createAgentProvider({
      name: "Local OpenCode",
      templateId: "opencode",
      enabled: true,
      baseUrl: "http://localhost:5000",
    });
    expect(created.id).toBeTruthy();
    expect(service.getAgentProviders().instances).toEqual([created]);
    expect(loadFileConfig(configDir)).toMatchObject({
      providers: { instances: [created] },
    });

    expect(service.deleteAgentProvider(created.id)).toEqual({ id: created.id });
    expect(service.getAgentProviders().instances).toEqual([]);
    expect(loadFileConfig(configDir)).toMatchObject({
      providers: { instances: [] },
    });
  });

  it("registers enabled instances and removes disabled or deleted instances", () => {
    const registry = {
      register: vi.fn(),
      remove: vi.fn(),
    } as unknown as AgentProviderRegistry;
    const configDir = mkdtempSync(path.join(tmpdir(), "cloudy-settings-"));
    tempDirs.push(configDir);
    const service = createAgentProviderSettingsService(
      config,
      configDir,
      registry,
    );

    service.updateAgentProvider("opencode", { enabled: false });
    expect(registry.remove).toHaveBeenCalledWith("opencode");
    expect(registry.register).not.toHaveBeenCalled();

    service.updateAgentProvider("opencode", { enabled: true });
    expect(registry.remove).toHaveBeenLastCalledWith("opencode");
    expect(registry.register).toHaveBeenCalledTimes(1);
    expect(service.deleteAgentProvider("opencode")).toEqual({ id: "opencode" });
    expect(registry.remove).toHaveBeenCalledTimes(3);
  });

  it("rejects updates and deletes for missing instances", () => {
    const service = createAgentProviderSettingsService(
      config,
      "/tmp/cloudy-provider-missing",
    );

    expect(() =>
      service.updateAgentProvider("missing", { enabled: false }),
    ).toThrow("Provider instance not found: missing");
    expect(() => service.deleteAgentProvider("missing")).toThrow(
      "Provider instance not found: missing",
    );
  });

  it("rolls back create, update, and delete mutations when persistence fails", () => {
    const instances = [...config.providers.instances];
    const service = createAgentProviderSettingsService(
      { ...config, providers: { ...config.providers, instances } },
      "/dev/null/cloudy-provider-settings",
    );

    expect(() =>
      service.createAgentProvider({
        name: "Local",
        templateId: "opencode",
        enabled: true,
        baseUrl: "http://localhost:5000",
      }),
    ).toThrow();
    expect(instances).toEqual(config.providers.instances);
    expect(() =>
      service.updateAgentProvider("opencode", { enabled: false }),
    ).toThrow();
    expect(instances).toEqual(config.providers.instances);
    expect(() => service.deleteAgentProvider("opencode")).toThrow();
    expect(instances).toEqual(config.providers.instances);
  });
});
