/**
 * @cloudy/server - External Type Exports
 *
 * This file defines the PUBLIC type interface for the API package.
 * Only types are exported - NO runtime code should ever be exported from this file.
 *
 * @exports
 * - `AppType`: The Hono application type for RPC client
 * - Model types (e.g. `PtyModel`, `WorkspacesModel`) via `./features`
 *
 * @security
 * - Uses `export type` to guarantee no runtime code leaks
 *
 * @usage
 * External packages should import via @cloudy/contracts, which re-exports these types:
 * ```ts
 * import type { AppType } from "@cloudy/contracts";
 * ```
 */

export type { AppType } from "./server";
export type * from "./features";
