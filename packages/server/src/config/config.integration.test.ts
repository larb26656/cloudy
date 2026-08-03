import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { loadConfig } from "./config";

const savedCloudy: Record<string, string | undefined> = {};
let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), "cloudy-test-" + randomUUID());
  mkdirSync(dir, { recursive: true });

  for (const key of Object.keys(process.env)) {
    if (key.startsWith("CLOUDY_")) {
      savedCloudy[key] = process.env[key];
      delete process.env[key];
    }
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });

  for (const key of Object.keys(savedCloudy)) {
    const value = savedCloudy[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
    delete savedCloudy[key];
  }
});

describe("loadConfig (integration)", () => {
  it("returns merged defaults and seeds config.json in the config dir", () => {
    const config = loadConfig({ configDir: dir });

    expect(config.host).toBe("localhost");
    expect(config.port).toBe(4122);
    expect(config.ui).toBe(false);
    expect(config.opencodeApiBase).toBe("http://localhost:4096");
    expect(config.cors).toBeUndefined();
    expect(config.dbPath).toBe(join(dir, "cloud.db"));
  });

  it("reads values from an existing config.json", () => {
    writeFileSync(
      join(dir, "config.json"),
      JSON.stringify({ host: "from.file", port: 9999 }),
    );

    const config = loadConfig({ configDir: dir });
    expect(config.host).toBe("from.file");
    expect(config.port).toBe(9999);
  });

  it("env overrides file values", () => {
    writeFileSync(
      join(dir, "config.json"),
      JSON.stringify({ host: "from.file" }),
    );
    vi.stubEnv("CLOUDY_HOST", "from.env");

    expect(loadConfig({ configDir: dir }).host).toBe("from.env");
  });

  it("option overrides env values", () => {
    vi.stubEnv("CLOUDY_HOST", "from.env");

    expect(
      loadConfig({ configDir: dir, host: "from.option" }).host,
    ).toBe("from.option");
  });

  it("coerces CLOUDY_PORT string env to number", () => {
    vi.stubEnv("CLOUDY_PORT", "8080");
    expect(loadConfig({ configDir: dir }).port).toBe(8080);
  });

  it("composes dbPath from the config dir", () => {
    expect(loadConfig({ configDir: dir }).dbPath).toBe(join(dir, "cloud.db"));
  });
});
