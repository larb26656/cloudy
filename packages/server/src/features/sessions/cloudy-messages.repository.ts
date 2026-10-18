import { and, asc, desc, eq, lt, sql } from "drizzle-orm";
import type { ChatMessage } from "@repo/ai-core";
import type { DbClient } from "../../db";
import { cloudyMessages } from "../../db/schema";

export function createCloudyMessagesRepository(db: DbClient) {
  return {
    append(message: ChatMessage, providerSessionId: string): void {
      db.insert(cloudyMessages)
        .values({
          id: message.id,
          providerSessionId,
          role: message.role,
          parts: message.parts,
          createdAt: new Date(message.createdAt),
          updatedAt: message.updatedAt ? new Date(message.updatedAt) : null,
        })
        .run();
    },
    update(message: ChatMessage, providerSessionId: string): void {
      db.update(cloudyMessages)
        .set({ parts: message.parts, updatedAt: new Date() })
        .where(
          and(
            eq(cloudyMessages.id, message.id),
            eq(cloudyMessages.providerSessionId, providerSessionId),
          ),
        )
        .run();
    },
    list(providerSessionId: string): ChatMessage[] {
      return db
        .select()
        .from(cloudyMessages)
        .where(eq(cloudyMessages.providerSessionId, providerSessionId))
        .orderBy(asc(sql`rowid`))
        .all()
        .map((row) => ({
          id: row.id,
          sessionId: providerSessionId,
          role: row.role as ChatMessage["role"],
          parts: row.parts as ChatMessage["parts"],
          createdAt: row.createdAt.toISOString(),
          ...(row.updatedAt ? { updatedAt: row.updatedAt.toISOString() } : {}),
        }));
    },
    listBefore(
      providerSessionId: string,
      input: { before?: string; limit?: number },
    ): ChatMessage[] {
      const cursor = input.before
        ? db
            .select({ rowid: sql<number>`rowid` })
            .from(cloudyMessages)
            .where(
              and(
                eq(cloudyMessages.id, input.before),
                eq(cloudyMessages.providerSessionId, providerSessionId),
              ),
            )
            .get()
        : undefined;
      const where = and(
        eq(cloudyMessages.providerSessionId, providerSessionId),
        ...(cursor ? [lt(sql<number>`rowid`, cursor.rowid)] : []),
      );
      const query = db
        .select()
        .from(cloudyMessages)
        .where(where)
        .orderBy(desc(sql`rowid`));
      const rows = input.limit
        ? query.limit(input.limit + 1).all()
        : query.all();
      return rows.map((row) => ({
        id: row.id,
        sessionId: providerSessionId,
        role: row.role as ChatMessage["role"],
        parts: row.parts as ChatMessage["parts"],
        createdAt: row.createdAt.toISOString(),
        ...(row.updatedAt ? { updatedAt: row.updatedAt.toISOString() } : {}),
      }));
    },
    deleteForSession(providerSessionId: string): void {
      db.delete(cloudyMessages)
        .where(eq(cloudyMessages.providerSessionId, providerSessionId))
        .run();
    },
  };
}

export type CloudyMessagesRepository = ReturnType<
  typeof createCloudyMessagesRepository
>;
