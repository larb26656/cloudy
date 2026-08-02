import { describe, it, expect } from "vitest";
import { createWorkspacesService } from "./workspaces.service";
import type { WorkspacesRepository } from "./workspaces.repository";
import type { WorkspaceDto } from "./workspaces.model";
import {
  WorkspaceNotFoundError,
  WorkspaceConflictError,
} from "./workspaces.errors";

function makeWorkspace(overrides: Partial<WorkspaceDto> = {}): WorkspaceDto {
  const now = new Date("2026-01-01T00:00:00Z");
  return {
    id: "ws-1",
    name: "Test",
    color: "#3B82F6",
    directory: "/tmp/test",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeRepo(
  seed: WorkspaceDto[] = [],
  overrides: Partial<WorkspacesRepository> = {},
): WorkspacesRepository {
  const store = new Map<string, WorkspaceDto>();
  for (const ws of seed) store.set(ws.id, ws);

  const findByDirectory = (directory: string) =>
    [...store.values()].find((w) => w.directory === directory) ?? null;

  return {
    list: () => [...store.values()],
    findById: (id) => store.get(id) ?? null,
    findByDirectory,
    create: (input) => {
      const ws = makeWorkspace({ ...input });
      store.set(ws.id, ws);
      return ws;
    },
    update: (id, input) => {
      const current = store.get(id);
      if (!current) return null;
      const next: WorkspaceDto = { ...current, ...input, updatedAt: new Date() };
      store.set(id, next);
      return next;
    },
    delete: (id) => {
      return store.delete(id);
    },
    ...overrides,
  };
}

describe("WorkspacesService", () => {
  it("list returns repository rows", () => {
    const seed = [makeWorkspace({ id: "a" }), makeWorkspace({ id: "b" })];
    const service = createWorkspacesService(makeRepo(seed));
    expect(service.list()).toHaveLength(2);
  });

  it("get returns dto when found", () => {
    const service = createWorkspacesService(makeRepo([makeWorkspace()]));
    expect(service.get("ws-1").id).toBe("ws-1");
  });

  it("get throws WorkspaceNotFoundError when missing", () => {
    const service = createWorkspacesService(makeRepo());
    expect(() => service.get("nope")).toThrow(WorkspaceNotFoundError);
    expect(() => service.get("nope")).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });

  it("create returns created workspace", () => {
    const service = createWorkspacesService(makeRepo());
    const ws = service.create({
      id: "ws-new",
      name: "New",
      color: "#10B981",
      directory: "/tmp/new",
    });
    expect(ws.id).toBe("ws-new");
    expect(ws.directory).toBe("/tmp/new");
  });

  it("create throws 409 on duplicate directory", () => {
    const service = createWorkspacesService(
      makeRepo([makeWorkspace({ directory: "/tmp/dup" })]),
    );
    expect(() =>
      service.create({
        id: "ws-other",
        name: "Other",
        color: "#000000",
        directory: "/tmp/dup",
      }),
    ).toThrow(WorkspaceConflictError);
    expect(() =>
      service.create({
        id: "ws-other",
        name: "Other",
        color: "#000000",
        directory: "/tmp/dup",
      }),
    ).toThrow(expect.objectContaining({ status: 409 }));
  });

  it("update patches fields when found", () => {
    const service = createWorkspacesService(makeRepo([makeWorkspace()]));
    const updated = service.update("ws-1", { name: "Renamed" });
    expect(updated.name).toBe("Renamed");
  });

  it("update throws 404 when missing", () => {
    const service = createWorkspacesService(makeRepo());
    expect(() => service.update("nope", { name: "x" })).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });

  it("update throws 409 when changing directory to one already used", () => {
    const service = createWorkspacesService(
      makeRepo([
        makeWorkspace({ id: "a", directory: "/tmp/a" }),
        makeWorkspace({ id: "b", directory: "/tmp/b" }),
      ]),
    );
    expect(() => service.update("a", { directory: "/tmp/b" })).toThrow(
      WorkspaceConflictError,
    );
  });

  it("update allows keeping the same directory on the same row", () => {
    const service = createWorkspacesService(
      makeRepo([makeWorkspace({ id: "a", directory: "/tmp/a" })]),
    );
    expect(() => service.update("a", { directory: "/tmp/a", name: "x" })).not.toThrow();
  });

  it("delete removes when found", () => {
    const service = createWorkspacesService(makeRepo([makeWorkspace()]));
    expect(() => service.delete("ws-1")).not.toThrow();
  });

  it("delete throws 404 when missing", () => {
    const service = createWorkspacesService(makeRepo());
    expect(() => service.delete("nope")).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });
});
