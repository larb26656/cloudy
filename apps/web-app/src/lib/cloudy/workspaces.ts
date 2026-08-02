import { z } from "zod";

export const WORKSPACE_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
] as const;

export const workspaceDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  directory: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Workspace = z.infer<typeof workspaceDtoSchema>;
