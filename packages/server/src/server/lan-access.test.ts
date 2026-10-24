import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createLanAccessService } from "../features/lan-access/lan-access.service";
import type { LanAccessRepository } from "../features/lan-access/lan-access.repository";
import { createLanAccessMiddleware } from "./lan-access";

function createService() {
  const hashes = new Set<string>();
  const repository: LanAccessRepository = {
    listDevices: () => [],
    createDevice: ({ tokenHash }) => {
      hashes.add(tokenHash);
      return { id: "device", name: "Test", createdAt: new Date() };
    },
    hasTokenHash: (tokenHash) => hashes.has(tokenHash),
    revokeDevice: () => false,
    revokeAll: () => hashes.clear(),
  };
  return createLanAccessService(repository);
}

describe("LAN access middleware", () => {
  it("requires a valid token for non-loopback requests", async () => {
    const service = createService();
    const { code } = service.createPin();
    const token = service.pair(code, "Test device");
    const app = new Hono()
      .use("/api/*", createLanAccessMiddleware(service))
      .get("/api/resource", (c) => c.text("ok"));

    expect((await app.request("/api/resource")).status).toBe(401);
    expect(
      (
        await app.request("/api/resource", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).status,
    ).toBe(200);
  });
});
