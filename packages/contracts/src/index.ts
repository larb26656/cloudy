/**
 * @cloudy/contracts
 *
 * Public interface for frontend applications to consume types from the Bun Monorepo.
 * This package aggregates and re-exports types from multiple internal packages.
 *
 * @exports
 * - AppType: Hono app type for RPC client
 * - IdeaModel, MemoryModel, ArtifactModel, ServeModel: Zod schemas for type-safe API
 *
 * @security
 * - Only TYPE exports (no runtime code)
 *
 * @usage Frontend apps should import from this package:
 * ```ts
 * import type { AppType, IdeaModel } from "@cloudy/contracts";
 * ```
 */

export type { AppType } from "@cloudy/server";
export type { IdeaModel, MemoryModel, ArtifactModel, ServeModel } from "@cloudy/server";
