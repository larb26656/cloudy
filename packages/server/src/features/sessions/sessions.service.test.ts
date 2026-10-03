import type { ChatSession, ProviderAdapter } from "@repo/ai-core";
import { describe, expect, it } from "vitest";
import { createProviderRegistry } from "../../providers";
import type { SessionRecord } from "../../db/schema";
import { createSessionsService } from "./sessions.service";
import type { SessionsRepository } from "./sessions.repository";
import { SessionConflictError, SessionNotFoundError } from "./sessions.errors";

function providerSession(id: string): ChatSession {
  return {
    id,
    providerId: "test",
    status: "idle",
    runStatus: "idle",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    directory: "/tmp/test",
  };
}

function repository(): SessionsRepository & { rows: SessionRecord[] } {
  const rows: SessionRecord[] = [];
  const active = (row: SessionRecord) => row.deletedAt === null;
  return {
    rows,
    list: () => rows.filter(active),
    findById: (id) => rows.find((row) => row.id === id && active(row)) ?? null,
    findByProviderSessionId: (providerId, providerSessionId) =>
      rows.find(
        (row) =>
          active(row) &&
          row.providerId === providerId &&
          row.providerSessionId === providerSessionId,
      ) ?? null,
    create: (input) => {
      const row = {
        ...input,
        title: input.title ?? null,
        directory: input.directory ?? null,
        parentId: input.parentId ?? null,
        metadata: input.metadata ?? null,
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date(),
        deletedAt: input.deletedAt ?? null,
      } as SessionRecord;
      rows.push(row);
      return row;
    },
    update: (id, input) => {
      const row = rows.find(
        (candidate) => candidate.id === id && active(candidate),
      );
      if (!row) return null;
      Object.assign(row, input, { updatedAt: new Date() });
      return row;
    },
    delete: (id) => {
      const row = rows.find(
        (candidate) => candidate.id === id && active(candidate),
      );
      if (!row) return false;
      row.deletedAt = new Date();
      return true;
    },
  };
}

function registry() {
  let next = 0;
  const provider: ProviderAdapter = {
    id: "test",
    capabilities: { streaming: true },
    getInfo: async () => ({
      id: "test",
      name: "Test",
      capabilities: { streaming: true },
    }),
    createSession: async () => providerSession(`native-${++next}`),
    subscribeEvents: async function* () {},
  };
  return createProviderRegistry({ providers: [provider] });
}

describe("sessions service", () => {
  it("creates a Cloudy UUID while retaining the provider binding", async () => {
    const repo = repository();
    const service = createSessionsService(repo, registry());

    const session = await service.create({ providerId: "test" });

    expect(session.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(session.providerId).toBe("test");
    expect(repo.rows[0]).toMatchObject({
      id: session.id,
      providerSessionId: "native-1",
    });
  });

  it("resolves provider events to the Cloudy session UUID", async () => {
    const repo = repository();
    const service = createSessionsService(repo, registry());
    const session = await service.create({ providerId: "test" });

    const event = service.mapEvent({
      type: "session.status",
      providerId: "test",
      sessionId: "native-1",
      status: "idle",
      runStatus: "idle",
    });

    expect(event).toMatchObject({ sessionId: session.id });
  });

  it("persists status events and maps them to the Cloudy session UUID", async () => {
    const repo = repository();
    const service = createSessionsService(repo, registry());
    const session = await service.create({ providerId: "test" });

    const event = await service.applyEvent({
      type: "session.status",
      providerId: "test",
      sessionId: "native-1",
      status: "active",
      runStatus: "running",
    });

    expect(event).toMatchObject({ sessionId: session.id });
    expect(repo.rows[0]).toMatchObject({
      status: "active",
      runStatus: "running",
    });
  });

  it("ignores unknown and deleted provider sessions", async () => {
    const repo = repository();
    const service = createSessionsService(repo, registry());

    await expect(
      service.applyEvent({
        type: "session.status",
        providerId: "test",
        sessionId: "missing",
        status: "active",
      }),
    ).resolves.toBeNull();

    const session = await service.create({ providerId: "test" });
    repo.rows[0]!.deletedAt = new Date();
    await expect(
      service.applyEvent({
        type: "run.failed",
        providerId: "test",
        sessionId: "native-1",
      }),
    ).resolves.toBeNull();
    expect(session.id).toBeDefined();
  });

  it("rejects duplicate provider references", async () => {
    const repo = repository();
    const service = createSessionsService(repo, registry());
    await service.create({ providerId: "test" });
    repo.rows[0]!.providerSessionId = "native-2";

    await expect(service.create({ providerId: "test" })).rejects.toBeInstanceOf(
      SessionConflictError,
    );
  });

  it("returns a domain 404 for unknown Cloudy session IDs", async () => {
    const service = createSessionsService(repository(), registry());

    await expect(
      service.get("00000000-0000-4000-8000-000000000000"),
    ).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      service.get("00000000-0000-4000-8000-000000000000"),
    ).rejects.toBeInstanceOf(SessionNotFoundError);
  });
});
