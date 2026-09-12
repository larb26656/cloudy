import { z } from "zod";
import { workspaceTypes } from "../../db/schema";

export const createWorkspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  directory: z.string().min(1),
  type: z.enum(workspaceTypes).default("agent"),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  type: z.enum(workspaceTypes).optional(),
  directory: z.string().min(1).optional(),
});
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export const workspaceDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  type: z.enum(workspaceTypes),
  directory: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type WorkspaceDto = z.infer<typeof workspaceDtoSchema>;

export const WorkspacesModel = {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceDtoSchema,
} as const;
