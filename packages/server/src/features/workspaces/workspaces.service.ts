import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceDto,
} from "./workspaces.model";
import type { WorkspacesRepository } from "./workspaces.repository";
import { WorkspaceNotFoundError, WorkspaceConflictError } from "./workspaces.errors";

/**
 * Workspaces business logic. Framework-free — throws `DomainError` subclasses
 * (`WorkspaceNotFoundError` → 404, `WorkspaceConflictError` → 409) so the HTTP
 * edge middleware can translate them. Sync throughout — no Promises.
 */
export function createWorkspacesService(repo: WorkspacesRepository) {
  const list = (): WorkspaceDto[] => repo.list();

  const get = (id: string): WorkspaceDto => {
    const ws = repo.findById(id);
    if (!ws) throw new WorkspaceNotFoundError(id);
    return ws;
  };

  const create = (input: CreateWorkspaceInput): WorkspaceDto => {
    if (repo.findByDirectory(input.directory)) {
      throw new WorkspaceConflictError(input.directory);
    }
    return repo.create(input);
  };

  const update = (id: string, input: UpdateWorkspaceInput): WorkspaceDto => {
    const existing = repo.findById(id);
    if (!existing) throw new WorkspaceNotFoundError(id);

    if (input.directory && input.directory !== existing.directory) {
      const conflict = repo.findByDirectory(input.directory);
      if (conflict) throw new WorkspaceConflictError(input.directory);
    }

    const updated = repo.update(id, input);
    if (!updated) throw new WorkspaceNotFoundError(id);
    return updated;
  };

  const remove = (id: string): void => {
    if (!repo.findById(id)) throw new WorkspaceNotFoundError(id);
    repo.delete(id);
  };

  return { list, get, create, update, delete: remove };
}

export type WorkspacesService = ReturnType<typeof createWorkspacesService>;
