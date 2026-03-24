/**
 * @cloudy/contracts
 *
 * Public interface for frontend applications to consume types from the Bun Monorepo.
 * This package aggregates and re-exports types from multiple internal packages.
 *
 * @exports
 * - App: Elysia app type for Eden
 * - IdeaModel, MemoryModel, ArtifactModel, ServeModel: TypeBox models for type-safe API
 *
 * @security
 * - Only TYPE exports (no runtime code)
 *
 * @usage Frontend apps should import from this package:
 * ```ts
 * import type { App, IdeaModel } from "@cloudy/contracts";
 * ```
 */

export type { App } from "@cloudy/server";
export type { IdeaModel, MemoryModel, ArtifactModel, ServeModel } from "@cloudy/server";
