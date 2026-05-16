import { text, timestamp, pgTable } from 'drizzle-orm/pg-core';

export const ideas = pgTable('ideas', {
    id: text('id').primaryKey(),
    title: text('title'),
    tags: text('tags').array(),
    status: text('status').default('draft').notNull(),
    priority: text('priority').default('medium').notNull(),
    path: text('path').unique().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});