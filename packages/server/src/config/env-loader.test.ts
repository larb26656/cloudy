import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CONFIG_PREFIX, getConfigEnvKey, loadEnvConfig } from "./env-loader";

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("CLOUDY_")) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const key of Object.keys(saved)) {
    const value = saved[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
    delete saved[key];
  }
});

describe("CONFIG_PREFIX", () => {
  it("is CLOUDY_", () => {
    expect(CONFIG_PREFIX).toBe("CLOUDY_");
  });
});

describe("getConfigEnvKey", () => {
  it("converts simple camelCase to CLOUDY_SNAKE_CASE", () => {
    expect(getConfigEnvKey("dbPath")).toBe("CLOUDY_DB_PATH");
  });

  it("converts multi-word camelCase", () => {
    expect(getConfigEnvKey("opencodeApiBase")).toBe("CLOUDY_OPENCODE_API_BASE");
  });

  it("converts single lowercase word", () => {
    expect(getConfigEnvKey("host")).toBe("CLOUDY_HOST");
  });
});

describe("loadEnvConfig", () => {
  it("returns the value of a set CLOUDY_* env var", () => {
    vi.stubEnv("CLOUDY_HOST", "from.env");
    expect(loadEnvConfig().host).toBe("from.env");
  });

  it("returns values for multiple env vars at once", () => {
    vi.stubEnv("CLOUDY_HOST", "h");
    vi.stubEnv("CLOUDY_PORT", "1234");
    const config = loadEnvConfig();
    expect(config.host).toBe("h");
    expect(config.port).toBe("1234");
  });

  it("returns undefined for unset env vars", () => {
    const config = loadEnvConfig();
    expect(config.host).toBeUndefined();
    expect(config.port).toBeUndefined();
    expect(config.dbPath).toBeUndefined();
  });

  it("does not pick up non-prefixed env vars", () => {
    vi.stubEnv("HOST", "should.not.be.picked");
    vi.stubEnv("PORT", "9999");
    const config = loadEnvConfig();
    expect(config.host).toBeUndefined();
    expect(config.port).toBeUndefined();
  });

  it("exposes every key of the configurable schema", () => {
    const config = loadEnvConfig();
    expect(Object.keys(config).sort()).toEqual(
      [
        "dbPath",
        "ui",
        "host",
        "port",
        "cors",
        "opencodeApiBase",
        "publicDir",
      ].sort(),
    );
  });
});
