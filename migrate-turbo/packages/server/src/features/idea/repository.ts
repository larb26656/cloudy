import { eq, like, and, or, asc, desc } from 'drizzle-orm';
import { ideas } from '@repo/database/schema';
import type { AppDatabase } from '@repo/database';
import type { CreateIdeaInput, IdeaQuery, UpdateIdeaInput } from './model';
import { toDateString } from '../../utils';

export type IdeaRecord = {
    id: string;
    title: string | null;
    tags: string[] | null;
    status: string;
    priority: string;
    path: string;
    createdAt: string;
    updatedAt: string;
};

export class IdeaRepository {
    constructor(private db: AppDatabase) {}

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

        const rows = await this.db.select().from(ideas).where(where).orderBy(orderBy);
        return rows.map((row) => ({
            ...row,
            createdAt: toDateString(row.createdAt),
            updatedAt: toDateString(row.updatedAt),
        }));
    }

    async findByPath(path: string): Promise<IdeaRecord | null> {
        const rows = await this.db
            .select()
            .from(ideas)
            .where(eq(ideas.path, path))
            .limit(1);

        const data = rows[0];
        if (!data) return null;

        return {
            ...data,
            createdAt: toDateString(data.createdAt),
            updatedAt: toDateString(data.updatedAt),
        };
    }

    async findById(id: string): Promise<IdeaRecord | null> {
        const rows = await this.db
            .select()
            .from(ideas)
            .where(eq(ideas.id, id))
            .limit(1);

        const data = rows[0];
        if (!data) return null;

        return {
            ...data,
            createdAt: toDateString(data.createdAt),
            updatedAt: toDateString(data.updatedAt),
        };
    }

    async exists(path: string): Promise<boolean> {
        const rows = await this.db
            .select({ count: ideas.id })
            .from(ideas)
            .where(eq(ideas.path, path))
            .limit(1);
        return rows.length > 0;
    }

    async touchUpdatedAt(path: string): Promise<void> {
        await this.db
            .update(ideas)
            .set({ updatedAt: new Date() })
            .where(eq(ideas.path, path));
    }

    async create(input: CreateIdeaInput & { id: string; path: string }): Promise<IdeaRecord> {
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

    async updateByPath(path: string, input: UpdateIdeaInput): Promise<IdeaRecord> {
        const existing = await this.findByPath(path);
        if (!existing) {
            throw new Error('Idea not found');
        }
        return this.update(existing.id, input);
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(ideas).where(eq(ideas.id, id));
    }

    async deleteByPath(path: string): Promise<void> {
        const existing = await this.findByPath(path);
        if (!existing) {
            throw new Error('Idea not found');
        }
        await this.delete(existing.id);
    }
}