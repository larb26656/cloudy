import type {
  CreateWorkspaceInput,
  TempWorkspaceDto,
  UpdateWorkspaceInput,
  WorkspaceDto,
} from "./workspaces.model";
import type { WorkspacesRepository } from "./workspaces.repository";
import {
  WorkspaceNotFoundError,
  WorkspaceConflictError,
} from "./workspaces.errors";
import { mkdir } from "fs/promises";
import path from "path";
import { randomWorkspaceName } from "../../lib/utils";

/**
 * Workspaces business logic. Framework-free — throws `DomainError` subclasses
 * (`WorkspaceNotFoundError` → 404, `WorkspaceConflictError` → 409) so the HTTP
 * edge middleware can translate them. Sync throughout — no Promises.
 */
export function createWorkspacesService(
  repo: WorkspacesRepository,
  tempWorkspaceDir: string,
) {
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

  const createTemp = async (): Promise<TempWorkspaceDto> => {
    const name = randomWorkspaceName();
    const directory = path.resolve(tempWorkspaceDir, name);
    await mkdir(directory, {
      recursive: true,
    });

    return {
      name,
      directory,
    };
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

  return { list, get, create, createTemp, update, delete: remove };
}

export type WorkspacesService = ReturnType<typeof createWorkspacesService>;
