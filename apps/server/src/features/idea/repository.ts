import { eq, like, and, or, asc, desc } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { ideas } from './schema';
import type { IdeaRecord, IdeaQuery, CreateIdeaInput, UpdateIdeaInput } from './types';

function toDateString(value: unknown): string {
    if (value instanceof Date) {
        return value.toISOString();
    }
    return String(value);
}

export class IdeaRepository {
    constructor(private db: PgliteDatabase) {}

    private async findOne(where: ReturnType<typeof eq>): Promise<IdeaRecord | null> {
        const rows = await this.db
            .select()
            .from(ideas)
            .where(where)
            .limit(1) as any[];
        if (!rows[0]) return null;
        return {
            ...rows[0],
            createdAt: toDateString(rows[0].createdAt),
            updatedAt: toDateString(rows[0].updatedAt),
        };
    }

    async findAll(query?: IdeaQuery): Promise<IdeaRecord[]> {
        const conditions = [];

        if (query?.status) {
            conditions.push(eq(ideas.status, query.status));
        }

        if (query?.priority) {
            conditions.push(eq(ideas.priority, query.priority));
        }

        if (query?.tags && query.tags.length > 0) {
            for (const tag of query.tags) {
                conditions.push(eq(ideas.tags, [tag]));
            }
        }

        if (query?.q) {
            conditions.push(
                or(
                    like(ideas.title, `%${query.q}%`),
                    like(ideas.path, `%${query.q}%`)
                )
            );
        }

        let orderBy = desc(ideas.updatedAt);
        if (query?.order) {
            const [field, direction] = query.order.split(':');
            if (field === 'updatedAt') {
                orderBy = direction === 'asc' ? asc(ideas.updatedAt) : desc(ideas.updatedAt);
            }
        }

        const conditionsCopy = [...conditions];
        const where = conditionsCopy.length > 0 ? and(...conditionsCopy) : undefined;

        const rows = await this.db.select().from(ideas).where(where).orderBy(orderBy) as any[];
        return rows.map((row) => ({
            ...row,
            createdAt: toDateString(row.createdAt),
            updatedAt: toDateString(row.updatedAt),
        })) as IdeaRecord[];
    }

    async findByPath(path: string): Promise<IdeaRecord | null> {
        return this.findOne(eq(ideas.path, path));
    }

    async findById(id: string): Promise<IdeaRecord | null> {
        return this.findOne(eq(ideas.id, id));
    }

    async exists(ideaPath: string): Promise<boolean> {
        const rows = await this.db
            .select({ count: ideas.id })
            .from(ideas)
            .where(eq(ideas.path, ideaPath))
            .limit(1) as any[];
        return rows.length > 0;
    }

    async touchUpdatedAt(ideaPath: string): Promise<void> {
        await this.db
            .update(ideas)
            .set({ updatedAt: new Date() })
            .where(eq(ideas.path, ideaPath));
    }

    async create(input: CreateIdeaInput): Promise<IdeaRecord> {
        const now = new Date();

        await this.db.insert(ideas).values({
            id: input.id,
            title: input.title ?? null,
            tags: input.tags ?? [],
            status: input.status ?? 'draft',
            priority: input.priority ?? 'medium',
            path: input.path,
            createdAt: now,
            updatedAt: now,
        });

        const created = await this.findById(input.id);
        if (!created) {
            throw new Error('Failed to create idea');
        }
        return created;
    }

    async update(id: string, input: UpdateIdeaInput): Promise<IdeaRecord> {
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error('Idea not found');
        }

        const updates: Record<string, unknown> = {};

        if (input.title !== undefined) {
            updates.title = input.title;
        }

        if (input.tags !== undefined) {
            updates.tags = input.tags;
        }

        if (input.status !== undefined) {
            updates.status = input.status;
        }

        if (input.priority !== undefined) {
            updates.priority = input.priority;
        }

        if (Object.keys(updates).length === 0) {
            return existing;
        }

        updates.updatedAt = new Date();

        await this.db
            .update(ideas)
            .set(updates)
            .where(eq(ideas.id, id));

        const updated = await this.findById(id);
        if (!updated) {
            throw new Error('Failed to update idea');
        }
        return updated;
    }

    async updateByPath(ideaPath: string, input: UpdateIdeaInput): Promise<IdeaRecord> {
        const existing = await this.findByPath(ideaPath);
        if (!existing) {
            throw new Error('Idea not found');
        }
        return this.update(existing.id, input);
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(ideas).where(eq(ideas.id, id));
    }

    async deleteByPath(ideaPath: string): Promise<void> {
        const existing = await this.findByPath(ideaPath);
        if (!existing) {
            throw new Error('Idea not found');
        }
        await this.delete(existing.id);
    }
}