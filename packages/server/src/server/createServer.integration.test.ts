import { describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "./createServer";

vi.mock("../db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../db")>();
  return {
    ...actual,
    runMigrations: () => {},
  };
});

describe("createServer (integration)", () => {
  it("reports the actually bound port when port is 0 and serves /api/health", async () => {
    const configDir = mkdtempSync(join(tmpdir(), "cloudy-server-test-"));
    const server = createServer({ port: 0, configDir });

    try {
      const { url } = await server.start();

      const parsed = new URL(url);
      expect(parsed.port).toMatch(/^\d+$/);
      expect(Number(parsed.port)).toBeGreaterThan(0);

      const response = await fetch(`${url}/api/health`);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: "ok" });
    } finally {
      await server.stop();
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  it("stop() resolves and releases the port", async () => {
    const configDir = mkdtempSync(join(tmpdir(), "cloudy-server-test-"));
    const server = createServer({ port: 0, configDir });

    const { url } = await server.start();
    await server.stop();

    await expect(fetch(`${url}/api/health`)).rejects.toThrow();
    rmSync(configDir, { recursive: true, force: true });
  });
});
