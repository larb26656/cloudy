import { z } from "zod";
import { workspaceDtoSchema } from "../workspaces/workspaces.model";

export const browserWorkspaceStatusSchema = z.discriminatedUnion(
  "initialized",
  [
    z.object({ initialized: z.literal(false) }),
    z.object({
      initialized: z.literal(true),
      workspace: workspaceDtoSchema,
      agent: z.literal("browser"),
    }),
  ],
);
export type BrowserWorkspaceStatus = z.infer<
  typeof browserWorkspaceStatusSchema
>;

export const BrowserWorkspaceModel = {
  browserWorkspaceStatusSchema,
} as const;
