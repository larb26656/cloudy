/**
 * Minimal config contract required by the database layer.
 *
 * Consumers (e.g. `@repo/server`) pass their own richer config object;
 * structural typing ensures any object with a `dbPath: string` satisfies this.
 */
export interface DatabaseConfig {
  dbPath: string;
}
