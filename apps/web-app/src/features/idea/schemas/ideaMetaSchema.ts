import { z } from "zod";

export const ideaStatusSchema = z.enum([
  "draft",
  "in-progress",
  "completed",
  "archived",
]);

export const ideaPrioritySchema = z.enum(["low", "medium", "high"]);

export const ideaMetaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  tags: z.string().min(0).max(500, "Tags input too long"),
  status: ideaStatusSchema,
  priority: ideaPrioritySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type IdeaMetaFormData = z.infer<typeof ideaMetaSchema>;
