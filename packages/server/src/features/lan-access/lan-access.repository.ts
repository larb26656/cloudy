import { eq } from "drizzle-orm";
import type { DbClient } from "../../db/client";
import { lanDevices } from "../../db/schema";
import type { LanDeviceDto } from "./lan-access.model";

export interface LanAccessRepository {
  listDevices(): LanDeviceDto[];
  createDevice(input: {
    id: string;
    name: string;
    tokenHash: string;
  }): LanDeviceDto;
  hasTokenHash(tokenHash: string): boolean;
  revokeDevice(id: string): boolean;
  revokeAll(): void;
}

function toDto(row: typeof lanDevices.$inferSelect): LanDeviceDto {
  return { id: row.id, name: row.name, createdAt: row.createdAt };
}

export function createLanAccessRepository(db: DbClient): LanAccessRepository {
  return {
    listDevices: () => db.select().from(lanDevices).all().map(toDto),
    createDevice: (input) => {
      const row = db.insert(lanDevices).values(input).returning().get();
      return toDto(row);
    },
    hasTokenHash: (tokenHash) =>
      db
        .select({ id: lanDevices.id })
        .from(lanDevices)
        .where(eq(lanDevices.tokenHash, tokenHash))
        .get() !== undefined,
    revokeDevice: (id) =>
      db.delete(lanDevices).where(eq(lanDevices.id, id)).run().changes > 0,
    revokeAll: () => {
      db.delete(lanDevices).run();
    },
  };
}
