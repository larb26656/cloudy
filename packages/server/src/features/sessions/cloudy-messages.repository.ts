import { and, asc, eq } from "drizzle-orm";
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
        .orderBy(asc(cloudyMessages.createdAt), asc(cloudyMessages.id))
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
