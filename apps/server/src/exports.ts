/**
 * @cloudy/server - External Type Exports
 *
 * This file defines the PUBLIC type interface for the API package.
 * Only types are exported - NO runtime code should ever be exported from this file.
 *
 * @exports
 * - `App`: The Elysia application type for Eden type-safe API client
 * - Model types: IdeaModel, MemoryModel, ServeModel
 *
 * @security
 * - Uses `export type` to guarantee no runtime code leaks
 *
 * @usage
 * External packages should import via @cloudy/contracts, which re-exports these types:
 * ```ts
 * import type { App, IdeaModel } from "@cloudy/contracts";
 * ```
 */

export type { App } from "./index";
export type * from "./features";
