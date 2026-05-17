import { eq, like, and, or, asc, desc, arrayContains } from 'drizzle-orm';
import { memories } from './schema';
import { AppDatabase } from '@server/db/client';
import type { CreateMemoryInput, MemoryQuery, MemoryDto, UpdateMemoryInput } from './model';

function toDateString(value: unknown): string {
    if (value instanceof Date) {
        return value.toISOString();
    }
    return String(value);
}

export class MemoryRepository {
    constructor(private db: AppDatabase) { }

    async findAll(query?: MemoryQuery): Promise<MemoryDto[]> {
        const conditions = [];

        if (query?.tags && query.tags.length > 0) {
            for (const tag of query.tags) {
                conditions.push(arrayContains(memories.tags, [tag]));
            }
        }

        if (query?.q) {
            const searchTerm = `%${query.q}%`;
            conditions.push(
                or(
                    like(memories.title, searchTerm),
                    like(memories.content, searchTerm)
                )
            );
        }

        let orderBy = desc(memories.updatedAt);
        if (query?.order) {
            const [field, direction] = query.order.split(':');
            if (field === 'updatedAt') {
                orderBy = direction === 'asc' ? asc(memories.updatedAt) : desc(memories.updatedAt);
            }
        }

        const conditionsCopy = [...conditions];
        const where = conditionsCopy.length > 0 ? and(...conditionsCopy) : undefined;

        const rows = await this.db.select().from(memories).where(where).orderBy(orderBy);

        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            content: row.content,
            tags: row.tags || [],
            createdAt: toDateString(row.createdAt),
            updatedAt: toDateString(row.updatedAt),
        }));
    }

    async findById(id: string): Promise<MemoryDto | null> {
        const rows = await this.db
            .select()
            .from(memories)
            .where(eq(memories.id, id))
            .limit(1);

        const data = rows[0];

        if (!data) return null;

        return {
            id: data.id,
            title: data.title,
            content: data.content,
            tags: data.tags || [],
            createdAt: toDateString(data.createdAt),
            updatedAt: toDateString(data.updatedAt),
        };
    }

    async create(input: CreateMemoryInput): Promise<MemoryDto> {
        const now = new Date();

        await this.db.insert(memories).values({
            id: input.id,
            title: input.title ?? null,
            content: input.content,
            tags: input.tags ?? [],
            createdAt: now,
            updatedAt: now,
        });

        const created = await this.findById(input.id);
        if (!created) {
            throw new Error('Failed to create memory');
        }
        return created;
    }

    async update(id: string, input: UpdateMemoryInput): Promise<MemoryDto> {
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error('Memory not found');
        }

        const updates: Record<string, unknown> = {};

        if (input.title !== undefined) {
            updates.title = input.title;
        }

        if (input.content !== undefined) {
            updates.content = input.content;
        }

        if (input.tags !== undefined) {
            updates.tags = input.tags;
        }

        if (Object.keys(updates).length === 0) {
            return existing;
        }

        updates.updatedAt = new Date();

        await this.db
            .update(memories)
            .set(updates)
            .where(eq(memories.id, id));

        const updated = await this.findById(id);
        if (!updated) {
            throw new Error('Failed to update memory');
        }
        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(memories).where(eq(memories.id, id));
    }
}