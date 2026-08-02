import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import * as ptyNative from "@lydell/node-pty";
import type { IPty } from "@lydell/node-pty";

export interface PtySession {
  id: string;
  pty: IPty;
  directory: string;
  command: string;
  exitCode: number | null;
}

export interface PtySpawnInput {
  directory: string;
  command?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
}

export type DataListener = (data: string) => void;
export type ExitListener = (code: number, signal?: number) => void;

/**
 * In-memory registry of live node-pty processes. Sessions die with the
 * server. Mirrors the existing repository pattern but keeps the IPty handle
 * directly (no DB row) since PTY state is process-bound, not queryable.
 */
export class PtyRepository {
  private sessions = new Map<string, PtySession>();
  private dataListeners = new Map<string, Set<DataListener>>();
  private exitListeners = new Map<string, Set<ExitListener>>();

  constructor(
    private spawnFactory: (input: PtySpawnInput) => IPty = defaultSpawn,
  ) {}

  spawn(input: PtySpawnInput): PtySession {
    const id = randomUUID();
    const pty = this.spawnFactory(input);
    const session: PtySession = {
      id,
      pty,
      directory: input.directory,
      command: input.command ?? process.env.SHELL ?? "/bin/sh",
      exitCode: null,
    };

    pty.onData((data) => {
      const set = this.dataListeners.get(id);
      if (set) for (const fn of set) fn(data);
    });
    pty.onExit(({ exitCode, signal }) => {
      session.exitCode = exitCode;
      const set = this.exitListeners.get(id);
      if (set) for (const fn of set) fn(exitCode, signal);
    });

    this.sessions.set(id, session);
    return session;
  }

  get(id: string): PtySession | null {
    return this.sessions.get(id) ?? null;
  }

  resize(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id);
    if (!session) return;
    session.pty.resize(cols, rows);
  }

  write(id: string, data: string): void {
    const session = this.sessions.get(id);
    if (!session) return;
    session.pty.write(data);
  }

  kill(id: string): void {
    const session = this.sessions.get(id);
    if (!session) return;
    try {
      session.pty.kill();
    } finally {
      this.cleanup(id);
    }
  }

  onData(id: string, fn: DataListener): () => void {
    let set = this.dataListeners.get(id);
    if (!set) {
      set = new Set();
      this.dataListeners.set(id, set);
    }
    set.add(fn);
    return () => set?.delete(fn);
  }

  onExit(id: string, fn: ExitListener): () => void {
    let set = this.exitListeners.get(id);
    if (!set) {
      set = new Set();
      this.exitListeners.set(id, set);
    }
    set.add(fn);
    return () => set?.delete(fn);
  }

  cleanup(id: string): void {
    this.dataListeners.delete(id);
    this.exitListeners.delete(id);
    this.sessions.delete(id);
  }
}

/**
 * Resolve which shell binary to spawn. Priority: explicit `command` arg →
 * `$SHELL` env → look up common absolute paths. Returns a non-empty string
 * so node-pty always has something to exec.
 */
export function resolveShell(command?: string): string {
  if (command) return command;
  if (process.env.SHELL && existsSync(process.env.SHELL)) return process.env.SHELL;
  const candidates = ["/bin/zsh", "/bin/bash", "/usr/bin/zsh", "/usr/bin/bash", "/bin/sh"];
  for (const c of candidates) if (existsSync(c)) return c;
  return "/bin/sh";
}

/**
 * Build the env passed to the spawned PTY. Defaults to inheriting the
 * server process env (filtered to defined values) merged with caller-
 * supplied overrides.
 */
export function buildEnv(overrides?: Record<string, string>): Record<string, string> {
  const inherited: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) inherited[k] = v;
  }
  return { ...inherited, ...(overrides ?? {}) };
}

function defaultSpawn(input: PtySpawnInput): IPty {
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
 * Discover shell binaries on the current system. Mirrors the opencode
 * `pty/shells` semantics: returns each candidate with `acceptable` set on
 * the first one we'd actually pick (the same resolution used at spawn
 * time). Useful for clients to preflight what shell will start.
 */
export function listShells(): ShellCandidate[] {
  const seen = new Set<string>();
  const out: ShellCandidate[] = [];
  const push = (path: string, acceptable: boolean) => {
    if (seen.has(path)) return;
    seen.add(path);
    out.push({ path, acceptable });
  };

  if (process.env.SHELL && existsSync(process.env.SHELL)) {
    push(process.env.SHELL, false);
  }
  for (const c of ["/bin/zsh", "/bin/bash", "/usr/bin/zsh", "/usr/bin/bash", "/bin/sh"]) {
    if (existsSync(c)) push(c, false);
  }

  const resolved = resolveShell();
  const entry = out.find((s) => s.path === resolved);
  if (entry) entry.acceptable = true;
  return out;
}

export interface ShellCandidate {
  path: string;
  acceptable: boolean;
}

/**
 * Resolve a `command` string that may be either an absolute path or a
 * bare command name (looked up on `$PATH` via the parent dir of common
 * shells). Used to normalise input before spawning.
 */
export function resolveCommandPath(command: string): string {
  if (command.includes("/")) return command;
  const pathEnv = process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin";
  for (const dir of pathEnv.split(":")) {
    const candidate = join(dir.trim(), command);
    if (existsSync(candidate)) return candidate;
  }
  return command;
}

export function shellDir(path: string): string {
  return dirname(path);
}
