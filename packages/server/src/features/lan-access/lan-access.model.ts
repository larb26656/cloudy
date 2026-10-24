import { z } from "zod";

export const pairDeviceSchema = z.object({
  code: z.string().length(6),
  name: z.string().trim().min(1).max(80).default("Paired device"),
});

export type LanDeviceDto = {
  id: string;
  name: string;
  createdAt: Date;
};
