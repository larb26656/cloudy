import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export interface ShellCandidate {
  path: string;
  acceptable: boolean;
}

/**
 * Resolve which shell binary to spawn. Priority: explicit `command` arg →
 * `$SHELL` env → look up common absolute paths. Returns a non-empty string
 * so node-pty always has something to exec.
 */
export function resolveShell(command?: string): string {
  if (command) return command;
  if (process.env.SHELL && existsSync(process.env.SHELL)) return process.env.SHELL;
  const candidates = [
    "/bin/zsh",
    "/bin/bash",
    "/usr/bin/zsh",
    "/usr/bin/bash",
    "/bin/sh",
  ];
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
  for (const c of [
    "/bin/zsh",
    "/bin/bash",
    "/usr/bin/zsh",
    "/usr/bin/bash",
    "/bin/sh",
  ]) {
    if (existsSync(c)) push(c, false);
  }

  const resolved = resolveShell();
  const entry = out.find((s) => s.path === resolved);
  if (entry) entry.acceptable = true;
  return out;
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
