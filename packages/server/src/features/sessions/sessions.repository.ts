import { and, desc, eq, isNull } from "drizzle-orm";
import type { DbClient } from "../../db";
import { sessions, type NewSession, type SessionRecord } from "../../db/schema";

export interface SessionsRepository {
  list(input: { directory?: string; limit?: number }): SessionRecord[];
  findById(id: string): SessionRecord | null;
  findByProviderSessionId(
    providerId: string,
    providerSessionId: string,
  ): SessionRecord | null;
  create(input: NewSession): SessionRecord;
  update(
    id: string,
    input: Partial<
      Pick<
        NewSession,
        "title" | "directory" | "metadata" | "parentId" | "status" | "runStatus"
      >
    >,
  ): SessionRecord | null;
  delete(id: string): boolean;
}

export function createSessionsRepository(db: DbClient): SessionsRepository {
  const active = isNull(sessions.deletedAt);

  const list = (input: {
    directory?: string;
    limit?: number;
  }): SessionRecord[] => {
    const where = input.directory
      ? and(active, eq(sessions.directory, input.directory))
      : active;
    let query = db
      .select()
      .from(sessions)
      .where(where)
      .orderBy(desc(sessions.updatedAt));
    if (input.limit) query = query.limit(input.limit) as typeof query;
    return query.all();
  };

  const findById = (id: string): SessionRecord | null =>
    db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), active))
      .get() ?? null;

  const findByProviderSessionId = (
    providerId: string,
    providerSessionId: string,
  ): SessionRecord | null =>
    db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.providerId, providerId),
          eq(sessions.providerSessionId, providerSessionId),
        ),
      )
      .get() ?? null;

  const create = (input: NewSession): SessionRecord =>
    db.insert(sessions).values(input).returning().get();

  const update = (
    id: string,
    input: Partial<
      Pick<NewSession, "title" | "directory" | "metadata" | "parentId">
    >,
  ): SessionRecord | null =>
    db
      .update(sessions)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(sessions.id, id), active))
      .returning()
      .get() ?? null;

  const remove = (id: string): boolean =>
    db
      .update(sessions)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(sessions.id, id), active))
      .run().changes > 0;

  return {
    list,
    findById,
    findByProviderSessionId,
    create,
    update,
    delete: remove,
  };
}
