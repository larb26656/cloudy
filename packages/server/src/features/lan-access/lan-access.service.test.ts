import { describe, expect, it } from "vitest";
import { createLanAccessService } from "./lan-access.service";
import type { LanAccessRepository } from "./lan-access.repository";

function createRepository(): LanAccessRepository & {
  entries: { id: string; name: string; tokenHash: string }[];
} {
  const entries: { id: string; name: string; tokenHash: string }[] = [];
  return {
    entries,
    listDevices: () =>
      entries.map(({ id, name }) => ({ id, name, createdAt: new Date() })),
    createDevice: (input) => {
      entries.push(input);
      return { id: input.id, name: input.name, createdAt: new Date() };
    },
    hasTokenHash: (tokenHash) =>
      entries.some((entry) => entry.tokenHash === tokenHash),
    revokeDevice: (id) => {
      const index = entries.findIndex((entry) => entry.id === id);
      if (index < 0) return false;
      entries.splice(index, 1);
      return true;
    },
    revokeAll: () => entries.splice(0),
  };
}

describe("LanAccessService", () => {
  it("expires PINs after 60 seconds", () => {
    const service = createLanAccessService(createRepository());
    const { code } = service.createPin(10_000);

    expect(service.pair(code, "Phone", 69_999)).not.toBeNull();
    const { code: expiredCode } = service.createPin(100_000);
    expect(service.pair(expiredCode, "Phone", 160_000)).toBeNull();
  });

  it("consumes a PIN once and stores only a token hash", () => {
    const repository = createRepository();
    const service = createLanAccessService(repository);
    const { code } = service.createPin();
    const token = service.pair(code, "Phone");

    expect(token).not.toBeNull();
    expect(repository.entries[0]?.tokenHash).not.toBe(token);
    expect(service.hasToken(token ?? undefined)).toBe(true);
    expect(service.pair(code, "Second phone")).toBeNull();
  });

  it("invalidates an active PIN when replacing it", () => {
    const service = createLanAccessService(createRepository());
    const first = service.createPin();
    const second = service.createPin();

    expect(service.pair(first.code, "Phone")).toBeNull();
    expect(service.pair(second.code, "Phone")).not.toBeNull();
  });
});
