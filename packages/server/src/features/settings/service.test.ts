import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadFileConfig } from "../../config/file-loader";
import type { AppConfig } from "../../config";
import { createSettingsService } from "./service";

const config: AppConfig = {
  dbPath: "/tmp/cloudy-test.db",
  ui: false,
  host: "localhost",
  port: 4122,
  cors: undefined,
  opencodeApiBase: "http://localhost:4096",
  providers: {
    opencode: { enabled: true, baseUrl: "http://localhost:4096" },
  },
  tempWorkspaceDir: "/tmp/workspaces",
  extensionWorkspaceDir: "/tmp/extensions",
};

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0))
    rmSync(tempDir, { recursive: true });
});

describe("settings service", () => {
  it("persists provider settings and removes the legacy OpenCode setting", () => {
    const configDir = mkdtempSync(path.join(tmpdir(), "cloudy-settings-"));
    tempDirs.push(configDir);
    const service = createSettingsService(config, configDir);

    const result = service.updateProviders({
      opencode: { enabled: false, baseUrl: "http://localhost:5000" },
    });

    expect(result).toEqual({
      providers: {
        opencode: { enabled: false, baseUrl: "http://localhost:5000" },
      },
      restartRequired: true,
    });
    expect(loadFileConfig(configDir)).toMatchObject({
      providers: {
        opencode: { enabled: false, baseUrl: "http://localhost:5000" },
      },
    });
    expect(loadFileConfig(configDir)).not.toHaveProperty("opencodeApiBase");
  });
});
