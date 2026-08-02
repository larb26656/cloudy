/**
 * @repo/contracts
 *
 * Type-only facade for frontend apps to consume API types from `@repo/server`
 * WITHOUT pulling Node.js runtime code (better-sqlite3, fs, commander, etc.) into
 * browser bundles.
 *
 * ## Why this package exists
 *
 * `@repo/server` contains Node-only transitive deps. Even though
 * `import type { AppType } from '@repo/server'` is stripped at compile time,
 * a missing `type` keyword (developer mistake, IDE auto-import) would let the
 * bundler follow the import graph and pull Node code into the browser.
 *
 * This package enforces the boundary structurally:
 * - All exports use `export type` only
 * - No runtime code, no transitive runtime deps
 * - Bundlers see an empty module at runtime
 *
 * ## Usage
 *
 * ```ts
 * // web-app/lib/api.ts
 * import type { AppType } from "@repo/contracts";
 * import { hc } from "hono/client";
 * export const api = hc<AppType>(import.meta.env.VITE_API_URL);
 * ```
 *
 * The `AppType` carries full route inference — request/response shapes for
 * every endpoint are derived automatically by `hono/client`. No need to
 * re-export individual model types here.
 *
 * ## Adding new exports
 *
 * Only add `export type` statements. Never add `export` (value) — that would
 * defeat the purpose of this package and risk leaking Node runtime code into
 * browser bundles.
 */

export type { AppType, ServerOptions } from "@repo/server";
export type {
  WorkspaceDto,
  WorkspaceNotFoundError,
  WorkspaceConflictError,
} from "@repo/server";
