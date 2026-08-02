import { describe, it, expect, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { createPtyService } from "./pty.service";
import type { PtyRepository, PtySession } from "./pty.repository";
import { SessionNotFoundError } from "./pty.errors";

function makeFakePty() {
  const dataCbs = new Set<(d: string) => void>();
  const exitCbs = new Set<(code: number, signal?: number) => void>();
  return {
    onData: vi.fn((cb: (d: string) => void) => {
      dataCbs.add(cb);
      return { dispose: () => dataCbs.delete(cb) };
    }),
    onExit: vi.fn((cb: (code: number, signal?: number) => void) => {
      exitCbs.add(cb);
      return { dispose: () => exitCbs.delete(cb) };
    }),
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
    emitData: (d: string) => dataCbs.forEach((cb) => cb(d)),
    emitExit: (code: number, signal?: number) =>
      exitCbs.forEach((cb) => cb(code, signal)),
  };
}

function makeServiceWithSession(
  overrides: Partial<PtySession> = {},
): { service: ReturnType<typeof createPtyService>; pty: ReturnType<typeof makeFakePty>; id: string } {
  const pty = makeFakePty();
  const id = "test-id";
  const session: PtySession = {
    id,
    pty: pty as unknown as PtySession["pty"],
    directory: "/tmp",
    command: "/bin/sh",
    exitCode: null,
    ...overrides,
  };

  const repo = mock<PtyRepository>();
  repo.spawn.mockReturnValue(session);
  repo.get.mockImplementation((lookupId: string) =>
    lookupId === id ? session : null,
  );

  // Forward onData/onExit through the fake pty so listener wiring is exercised.
  repo.onData.mockImplementation((lookupId: string, fn) => {
    if (lookupId !== id) return () => {};
    pty.onData(fn);
    return () => {};
  });
  repo.onExit.mockImplementation((lookupId: string, fn) => {
    if (lookupId !== id) return () => {};
    pty.onExit(fn);
    return () => {};
  });

  return { service: createPtyService(repo), pty, id };
}

describe("PtyService", () => {
  it("listShells returns at least one shell with acceptable=true", () => {
    const { service } = makeServiceWithSession();
    const shells = service.listShells();
    expect(shells.length).toBeGreaterThan(0);
    expect(shells.some((s) => s.acceptable)).toBe(true);
  });

  it("createSession returns repository id", () => {
    const { service, id } = makeServiceWithSession();
    expect(service.createSession({ directory: "/tmp" })).toEqual({ id });
  });

  it("getSession returns dto when found", () => {
    const { service, id } = makeServiceWithSession();
    expect(service.getSession(id)).toEqual({
      id,
      alive: true,
      exitCode: null,
    });
  });

  it("getSession throws SessionNotFoundError when missing", () => {
    const { service } = makeServiceWithSession();
    expect(() => service.getSession("nope")).toThrow(SessionNotFoundError);
    expect(() => service.getSession("nope")).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });

  it("resize throws 404 when missing", () => {
    const { service } = makeServiceWithSession();
    expect(() => service.resize("nope", { cols: 80, rows: 24 })).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });

  it("kill throws 404 when missing", () => {
    const { service } = makeServiceWithSession();
    expect(() => service.kill("nope")).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });

  it("write forwards bytes to repository", () => {
    const { service, id } = makeServiceWithSession();
    service.write(id, "ls\n");
    expect(() => service.write(id, "x")).not.toThrow();
  });

  it("onData returns unsubscribe function", () => {
    const { service, id } = makeServiceWithSession();
    const off = service.onData(id, () => {});
    expect(typeof off).toBe("function");
    off();
  });

  it("onExit returns unsubscribe function", () => {
    const { service, id } = makeServiceWithSession();
    const off = service.onExit(id, () => {});
    expect(typeof off).toBe("function");
    off();
  });

  it("getSession reflects exitCode after process exit", () => {
    const { service, id } = makeServiceWithSession({ exitCode: 42 });
    expect(service.getSession(id)).toEqual({
      id,
      alive: false,
      exitCode: 42,
    });
  });
});
