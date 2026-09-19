import { describe, it, expect, beforeEach, vi } from "vitest";
import path from "node:path";
import { homedir } from "node:os";

vi.mock("./env-loader", () => ({
  loadEnvConfig: vi.fn(),
}));
vi.mock("./file-loader", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./file-loader")>()),
  loadFileConfig: vi.fn(),
}));

import { ConfigurableSchema, loadConfig } from "./config";
import { loadEnvConfig } from "./env-loader";
import { loadFileConfig } from "./file-loader";

const mockedLoadEnvConfig = vi.mocked(loadEnvConfig);
const mockedLoadFileConfig = vi.mocked(loadFileConfig);

function parseConfigurable(input: Record<string, unknown>) {
  return ConfigurableSchema.parse({
    tempWorkspaceDir: "/tmp",
    extensionWorkspaceDir: "/tmp/extensions",
    ...input,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedLoadEnvConfig.mockReturnValue({});
  mockedLoadFileConfig.mockReturnValue({});
});

describe("ConfigurableSchema", () => {
  describe("ui", () => {
    it("parses true boolean", () => {
      expect(parseConfigurable({ dbPath: "/x", ui: true }).ui).toBe(true);
    });

    it("parses 'true' string as true", () => {
      expect(parseConfigurable({ dbPath: "/x", ui: "true" }).ui).toBe(true);
    });

    it("parses false boolean", () => {
      expect(parseConfigurable({ dbPath: "/x", ui: false }).ui).toBe(false);
    });

    it("parses 'false' string as false", () => {
      expect(parseConfigurable({ dbPath: "/x", ui: "false" }).ui).toBe(false);
    });

    it("defaults to false when missing", () => {
      expect(parseConfigurable({ dbPath: "/x" }).ui).toBe(false);
    });
  });

  describe("port", () => {
    it("coerces numeric string to number", () => {
      expect(parseConfigurable({ dbPath: "/x", port: "4122" }).port).toBe(4122);
    });

    it("accepts a number", () => {
      expect(parseConfigurable({ dbPath: "/x", port: 3000 }).port).toBe(3000);
    });

    it("defaults to 4122 when missing", () => {
      expect(parseConfigurable({ dbPath: "/x" }).port).toBe(4122);
    });
  });

  describe("cors", () => {
    it("transforms empty string to undefined", () => {
      expect(
        parseConfigurable({ dbPath: "/x", cors: "" }).cors,
      ).toBeUndefined();
    });

    it("keeps '*' as the string '*'", () => {
      expect(parseConfigurable({ dbPath: "/x", cors: "*" }).cors).toBe("*");
    });

    it("splits comma-separated origins and trims whitespace", () => {
      expect(
        parseConfigurable({
          dbPath: "/x",
          cors: "a.com, b.com , c.com",
        }).cors,
      ).toEqual(["a.com", "b.com", "c.com"]);
    });

    it("defaults to undefined", () => {
      expect(parseConfigurable({ dbPath: "/x" }).cors).toBeUndefined();
    });
  });

  describe("host", () => {
    it("defaults to localhost", () => {
      expect(parseConfigurable({ dbPath: "/x" }).host).toBe("localhost");
    });
  });

  describe("opencodeApiBase", () => {
    it("defaults to http://localhost:4096", () => {
      expect(parseConfigurable({ dbPath: "/x" }).opencodeApiBase).toBe(
        "http://localhost:4096",
      );
    });
  });
});

describe("loadConfig", () => {
  it("returns all defaults when loaders return empty", () => {
    const config = loadConfig();
    expect(config.host).toBe("localhost");
    expect(config.port).toBe(4122);
    expect(config.ui).toBe(false);
    expect(config.opencodeApiBase).toBe("http://localhost:4096");
    expect(config.tempWorkspaceDir).toBe(
      path.join(homedir(), ".config", "cloudy", "workspaces"),
    );
    expect(config.extensionWorkspaceDir).toBe(
      path.join(homedir(), ".config", "cloudy", "extensions"),
    );
    expect(config.cors).toBeUndefined();
  });

  it("composes dbPath from configDir + cloud.db", () => {
    const config = loadConfig({ configDir: "/custom/dir" });
    expect(config.dbPath).toBe(path.join("/custom/dir", "cloud.db"));
  });

  it("composes tempWorkspaceDir from configDir + workspaces", () => {
    const config = loadConfig({ configDir: "/custom/dir" });
    expect(config.tempWorkspaceDir).toBe(
      path.join("/custom/dir", "workspaces"),
    );
  });

  it("composes extensionWorkspaceDir from configDir + extensions", () => {
    const config = loadConfig({ configDir: "/custom/dir" });
    expect(config.extensionWorkspaceDir).toBe(
      path.join("/custom/dir", "extensions"),
    );
  });

  it("expands ~ in configDir against the user home, not the cwd", () => {
    const config = loadConfig({ configDir: "~/.config/cloudy" });
    expect(config.dbPath).toBe(
      path.join(homedir(), ".config", "cloudy", "cloud.db"),
    );
    expect(config.dbPath.startsWith("~")).toBe(false);
  });

  it("file config overrides defaults", () => {
    mockedLoadFileConfig.mockReturnValue({ host: "from.file" });
    expect(loadConfig().host).toBe("from.file");
  });

  it("env config overrides file config", () => {
    mockedLoadFileConfig.mockReturnValue({ host: "from.file" });
    mockedLoadEnvConfig.mockReturnValue({ host: "from.env" });
    expect(loadConfig().host).toBe("from.env");
  });

  it("option overrides env config", () => {
    mockedLoadEnvConfig.mockReturnValue({ host: "from.env" });
    expect(loadConfig({ host: "from.option" }).host).toBe("from.option");
  });

  it("does not let undefined option values override lower-priority sources", () => {
    mockedLoadFileConfig.mockReturnValue({ host: "from.file" });
    mockedLoadEnvConfig.mockReturnValue({ host: undefined });
    expect(loadConfig({ host: undefined }).host).toBe("from.file");
  });

  it("passes configDir option to loadFileConfig", () => {
    loadConfig({ configDir: "/custom/dir" });
    expect(mockedLoadFileConfig).toHaveBeenCalledWith("/custom/dir");
  });

  it("uses the base config dir when no configDir option is given", () => {
    loadConfig();
    expect(mockedLoadFileConfig).toHaveBeenCalledWith(
      path.join(homedir(), ".config", "cloudy"),
    );
  });

  it("strips unknown option keys (configDir is not part of AppConfig)", () => {
    const config = loadConfig({ configDir: "/custom/dir" });
    expect(config).not.toHaveProperty("configDir");
  });
});
