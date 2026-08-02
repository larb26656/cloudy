import { eq } from "drizzle-orm";
import type { DbClient } from "../../db/client";
import { workspaces, type NewWorkspace } from "../../db/schema";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./workspaces.model";
import type { WorkspaceDto } from "./workspaces.model";

/**
 * Drizzle-only persistence layer for workspaces. Maps DB rows → DTOs. Throws
 * plain `Error` for unexpected internal failures; returns `null` for misses so
 * the service can decide the HTTP status. Sync — `better-sqlite3` is sync.
 */
export interface WorkspacesRepository {
  list(): WorkspaceDto[];
  findById(id: string): WorkspaceDto | null;
  findByDirectory(directory: string): WorkspaceDto | null;
  create(input: CreateWorkspaceInput): WorkspaceDto;
  update(id: string, input: UpdateWorkspaceInput): WorkspaceDto | null;
  delete(id: string): boolean;
}

function toDto(row: typeof workspaces.$inferSelect): WorkspaceDto {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    directory: row.directory,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createWorkspacesRepository(db: DbClient): WorkspacesRepository {
  const list = (): WorkspaceDto[] => db.select().from(workspaces).all().map(toDto);

  const findById = (id: string): WorkspaceDto | null => {
    const row = db.select().from(workspaces).where(eq(workspaces.id, id)).get();
    return row ? toDto(row) : null;
  };

  const findByDirectory = (directory: string): WorkspaceDto | null => {
    const row = db
      .select()
      .from(workspaces)
      .where(eq(workspaces.directory, directory))
      .get();
    return row ? toDto(row) : null;
  };

  const create = (input: CreateWorkspaceInput): WorkspaceDto => {
    const newRow: NewWorkspace = {
      id: input.id,
      name: input.name,
      color: input.color,
      directory: input.directory,
    };
    const result = db.insert(workspaces).values(newRow).returning().get();
    return toDto(result);
  };

  const update = (id: string, input: UpdateWorkspaceInput): WorkspaceDto | null => {
    const result = db
      .update(workspaces)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning()
      .get();
    return result ? toDto(result) : null;
  };

  const remove = (id: string): boolean => {
    const result = db.delete(workspaces).where(eq(workspaces.id, id)).run();
    return result.changes > 0;
  };

  return { list, findById, findByDirectory, create, update, delete: remove };
}
