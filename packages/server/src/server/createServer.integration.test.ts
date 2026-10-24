import { describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "./createServer";

vi.mock("../providers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../providers")>();
  return {
    ...actual,
    createProviderEventHub: () => ({
      start: () => {},
      stop: async () => {},
      subscribeEvents: () => ({
        async *[Symbol.asyncIterator]() {},
      }),
    }),
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

  it("issues a one-time PIN and stores paired devices in the database", async () => {
    const configDir = mkdtempSync(join(tmpdir(), "cloudy-server-test-"));
    const server = createServer({
      port: 0,
      configDir,
      secureLanAccess: true,
    });

    try {
      const { url } = await server.start();
      const pinResponse = await fetch(`${url}/api/lan/pin`, { method: "POST" });
      const pin = (await pinResponse.json()) as {
        code: string;
        expiresAt: number;
      };
      expect(pinResponse.status).toBe(200);
      expect(pin.expiresAt).toBeGreaterThan(Date.now());

      const response = await fetch(`${url}/api/lan/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pin.code, name: "Test phone" }),
      });
      const result = (await response.json()) as { token: string };

      expect(response.status).toBe(200);
      expect(result.token).toHaveLength(43);
      const devicesResponse = await fetch(`${url}/api/lan/devices`);
      const devices = (await devicesResponse.json()) as {
        devices: { id: string; name: string }[];
      };
      expect(devices.devices).toHaveLength(1);
      expect(devices.devices[0]?.name).toBe("Test phone");
      const revokeResponse = await fetch(
        `${url}/api/lan/devices/${devices.devices[0]?.id}`,
        { method: "DELETE" },
      );
      expect(revokeResponse.status).toBe(200);
      expect(
        (
          (await (await fetch(`${url}/api/lan/devices`)).json()) as {
            devices: unknown[];
          }
        ).devices,
      ).toHaveLength(0);
      const secondPair = await fetch(`${url}/api/lan/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pin.code }),
      });
      expect(secondPair.status).toBe(401);
    } finally {
      await server.stop();
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  it("does not expose PIN creation or pairing when secure access is disabled", async () => {
    const configDir = mkdtempSync(join(tmpdir(), "cloudy-server-test-"));
    const server = createServer({
      port: 0,
      configDir,
      secureLanAccess: false,
    });

    try {
      const { url } = await server.start();
      const pinResponse = await fetch(`${url}/api/lan/pin`, { method: "POST" });
      const response = await fetch(`${url}/api/lan/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "123456" }),
      });

      expect(pinResponse.status).toBe(404);
      expect(response.status).toBe(404);
    } finally {
      await server.stop();
      rmSync(configDir, { recursive: true, force: true });
    }
  });
});
