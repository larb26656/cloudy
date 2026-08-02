import { randomUUID } from "node:crypto";
import * as ptyNative from "@lydell/node-pty";
import type { IPty } from "@lydell/node-pty";
import type {
  DataListener,
  ExitListener,
  PtyRepository,
  PtySession,
  PtySpawnInput,
} from "./pty.repository";
import { buildEnv, resolveShell } from "./shell-resolver";

/**
 * Spawn a real `node-pty` process for the given input. Lives behind a seam
 * (`spawnFactory`) so tests can substitute a fake.
 */
export function defaultSpawn(input: PtySpawnInput): IPty {
  const file = resolveShell(input.command);
  const args: string[] = [];
  // If the resolved shell is an absolute path to a known shell binary, run
  // it as a login shell so `~/.zshrc` / `~/.bash_profile` get sourced.
  const base = file.split("/").pop() ?? "";
  if (base === "zsh" || base === "bash" || base === "sh") args.push("-l");

  return ptyNative.spawn(file, args, {
    name: "xterm-256color",
    cols: input.cols ?? 80,
    rows: input.rows ?? 24,
    cwd: input.directory,
    env: buildEnv(input.env),
  });
}

/**
 * In-memory registry of live node-pty processes. Sessions die with the
 * server. State lives in closure-captured `Map`s — there is no class, so the
 * `PtyRepository` interface is satisfied by a plain object literal returned to
 * the caller.
 */
export function createInMemoryPtyRepository(
  spawnFactory: (input: PtySpawnInput) => IPty = defaultSpawn,
): PtyRepository {
  const sessions = new Map<string, PtySession>();
  const dataListeners = new Map<string, Set<DataListener>>();
  const exitListeners = new Map<string, Set<ExitListener>>();

  const cleanup = (id: string): void => {
    dataListeners.delete(id);
    exitListeners.delete(id);
    sessions.delete(id);
  };

  const spawn = (input: PtySpawnInput): PtySession => {
    const id = randomUUID();
    const pty = spawnFactory(input);
    const session: PtySession = {
      id,
      pty,
      directory: input.directory,
      command: input.command ?? process.env.SHELL ?? "/bin/sh",
      exitCode: null,
    };

    pty.onData((data) => {
      const set = dataListeners.get(id);
      if (set) for (const fn of set) fn(data);
    });
    pty.onExit(({ exitCode, signal }) => {
      session.exitCode = exitCode;
      const set = exitListeners.get(id);
      if (set) for (const fn of set) fn(exitCode, signal);
    });

    sessions.set(id, session);
    return session;
  };

  const get = (id: string): PtySession | null => sessions.get(id) ?? null;

  const resize = (id: string, cols: number, rows: number): void => {
    const session = sessions.get(id);
    if (!session) return;
    session.pty.resize(cols, rows);
  };

  const write = (id: string, data: string): void => {
    const session = sessions.get(id);
    if (!session) return;
    session.pty.write(data);
  };

  const kill = (id: string): void => {
    const session = sessions.get(id);
    if (!session) return;
    try {
      session.pty.kill();
    } finally {
      cleanup(id);
    }
  };

  const onData = (id: string, fn: DataListener): (() => void) => {
    let set = dataListeners.get(id);
    if (!set) {
      set = new Set();
      dataListeners.set(id, set);
    }
    set.add(fn);
    return () => {
      set?.delete(fn);
    };
  };

  const onExit = (id: string, fn: ExitListener): (() => void) => {
    let set = exitListeners.get(id);
    if (!set) {
      set = new Set();
      exitListeners.set(id, set);
    }
    set.add(fn);
    return () => {
      set?.delete(fn);
    };
  };

  return { spawn, get, resize, write, kill, onData, onExit };
}
