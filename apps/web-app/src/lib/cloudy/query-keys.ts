/**
 * Query keys for cloudy-server-backed resources (the Hono RPC surface at
 * `cloudyClient.api.*`). Mirrors the `lib/opencode/query-keys.ts` pattern
 * but kept separate because the cache invalidation lifecycle for cloudy
 * resources is independent from opencode-backed ones.
 *
 * Add new feature factories here as more cloudy endpoints land behind
 * React Query.
 */

export const ptyKeys = {
  root: () => ["pty"] as const,
  shells: () => ["pty", "shells"] as const,
  detail: (id: string) => ["pty", "sessions", id] as const,
};

export const workspaceKeys = {
  root: () => ["workspaces"] as const,
  list: () => [...workspaceKeys.root(), "list"] as const,
  detail: (id: string) => [...workspaceKeys.root(), "detail", id] as const,
};
