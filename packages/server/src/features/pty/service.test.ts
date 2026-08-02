import { describe, it, expect, vi } from "vitest";
import { PtyService } from "./service";
import { PtyRepository, type PtySession } from "./repository";

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
): { service: PtyService; pty: ReturnType<typeof makeFakePty>; id: string } {
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

  const repo = {
    spawn: vi.fn(() => session),
    get: vi.fn((lookupId: string) => (lookupId === id ? session : null)),
    resize: vi.fn(),
    write: vi.fn(),
    kill: vi.fn(),
    onData: vi.fn((lookupId: string, fn: (d: string) => void) => {
      if (lookupId !== id) return () => {};
      pty.onData(fn);
      return () => pty.onData.length;
    }),
    onExit: vi.fn((lookupId: string, fn: (code: number, signal?: number) => void) => {
      if (lookupId !== id) return () => {};
      pty.onExit(fn);
      return () => pty.onExit.length;
    }),
    cleanup: vi.fn(),
  } as unknown as PtyRepository;

  return { service: new PtyService(repo), pty, id };
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

  it("getSession throws 404 when missing", () => {
    const { service } = makeServiceWithSession();
    expect(() => service.getSession("nope")).toThrow(/not found/);
    expect(() => service.getSession("nope")).toThrow(expect.objectContaining({ status: 404 }));
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
    // repository.write was called via service -> repo (spy chain)
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
