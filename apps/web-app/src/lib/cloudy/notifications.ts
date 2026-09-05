import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "info",
  "success",
  "warning",
  "error",
]);

export const notificationDtoSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.string()).nullable(),
  createdAt: z.coerce.date(),
});

export type Notification = z.infer<typeof notificationDtoSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
