import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "info",
  "success",
  "warning",
  "error",
]);

export const createNotificationSchema = z.object({
  type: notificationTypeSchema,
  title: z.string().min(1),
  message: z.string(),
  metadata: z.record(z.string(), z.string()).nullable().optional(),
});
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const notificationDtoSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.string()).nullable(),
  createdAt: z.coerce.date(),
});
export type NotificationDto = z.infer<typeof notificationDtoSchema>;

export const NotificationsModel = {
  createNotificationSchema,
  notificationDtoSchema,
} as const;
