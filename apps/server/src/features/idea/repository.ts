import { getDb } from '../../db/client';
import { IDEA_INDEX_FILE } from './types';
import type { IdeaRecord, IdeaQuery, CreateIdeaInput, UpdateIdeaInput } from './types';

export class IdeaRepository {

    async findAll(query?: IdeaQuery): Promise<IdeaRecord[]> {
        const db = getDb();
        const conditions: string[] = [];
        const args: any[] = [];

        if (query?.status) {
            conditions.push('status = ?');
            args.push(query.status);
        }

        if (query?.priority) {
            conditions.push('priority = ?');
            args.push(query.priority);
        }

        if (query?.tags && query.tags.length > 0) {
            conditions.push('tags && ?');
            args.push(query.tags);
        }

        if (query?.q) {
            conditions.push('(title LIKE ? OR path LIKE ?)');
            args.push(`%${query.q}%`, `%${query.q}%`);
        }

        let sql = 'SELECT * FROM ideas';
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        if (query?.order) {
            const [field, direction] = query.order.split(':');
            if (field === 'updatedAt') {
                sql += ` ORDER BY updated_at ${direction === 'asc' ? 'ASC' : 'DESC'}`;
            }
        } else {
            sql += ' ORDER BY updated_at DESC';
        }

        const result = await db.execute(sql, args);
        return result.rows as unknown as IdeaRecord[];
    }

    async findByPath(path: string): Promise<IdeaRecord | null> {
        const db = getDb();
        const result = await db.execute(
            'SELECT * FROM ideas WHERE path = ?',
            [path]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as unknown as IdeaRecord;
    }

    async findById(id: string): Promise<IdeaRecord | null> {
        const db = getDb();
        const result = await db.execute(
            'SELECT * FROM ideas WHERE id = ?',
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as unknown as IdeaRecord;
    }

    async exists(ideaPath: string): Promise<boolean> {
        const db = getDb();
        const result = await db.execute(
            'SELECT 1 FROM ideas WHERE path = ?',
            [ideaPath]
        );
        return result.rows.length > 0;
    }

    async touchUpdatedAt(ideaPath: string): Promise<void> {
        const db = getDb();
        await db.execute(
            'UPDATE ideas SET updated_at = ? WHERE path = ?',
            [new Date().toISOString(), ideaPath]
        );
    }

    async create(input: CreateIdeaInput): Promise<IdeaRecord> {
        const db = getDb();
        const now = new Date().toISOString();

        await db.execute(
            `INSERT INTO ideas (id, title, tags, status, priority, path, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                input.id,
                input.title || null,
                JSON.stringify(input.tags || []),
                input.status || 'draft',
                input.priority || 'medium',
                input.path,
                now,
                now,
            ]
        );

        const created = await this.findById(input.id);
        if (!created) {
            throw new Error('Failed to create idea');
        }
        return created;
    }

    async update(id: string, input: UpdateIdeaInput): Promise<IdeaRecord> {
        const db = getDb();
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error('Idea not found');
        }

        const updates: string[] = [];
        const args: any[] = [];

        if (input.title !== undefined) {
            updates.push('title = ?');
            args.push(input.title);
        }

        if (input.tags !== undefined) {
            updates.push('tags = ?');
            args.push(JSON.stringify(input.tags));
        }

        if (input.status !== undefined) {
            updates.push('status = ?');
            args.push(input.status);
        }

        if (input.priority !== undefined) {
            updates.push('priority = ?');
            args.push(input.priority);
        }

        if (updates.length === 0) {
            return existing;
        }

        updates.push('updated_at = ?');
        args.push(new Date().toISOString());
        args.push(id);

        await db.execute(
            `UPDATE ideas SET ${updates.join(', ')} WHERE id = ?`,
            args
        );

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
        const db = getDb();
        await db.execute('DELETE FROM ideas WHERE id = ?', [id]);
    }

    async deleteByPath(ideaPath: string): Promise<void> {
        const existing = await this.findByPath(ideaPath);
        if (!existing) {
            throw new Error('Idea not found');
        }
        await this.delete(existing.id);
    }
}

export const ideaRepository = new IdeaRepository();
