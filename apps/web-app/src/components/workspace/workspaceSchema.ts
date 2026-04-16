import { z } from "zod";
import { WORKSPACE_COLORS } from "@/stores/workspaceStore";

const colorEnum = z.enum(WORKSPACE_COLORS);

export const workspaceSchema = z.object({
  instanceId: z.string().min(1, "Please select an instance"),
  name: z.string().min(1, "Please enter a workspace name"),
  directory: z.string().min(1, "Please enter a directory path"),
  color: colorEnum,
});

export type WorkspaceFormData = z.infer<typeof workspaceSchema>;
