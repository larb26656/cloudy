import { createClient, type Client } from '@libsql/client';
import { env } from '../config/env';

let db: Client | null = null;

export function getDb(): Client {
    if (!db) {
        db = createClient({
            url: env.TURSO_DATABASE_URL || 'file:local.db',
            authToken: env.TURSO_AUTH_TOKEN,
        });
    }
    return db;
}

export async function closeDb(): Promise<void> {
    if (db) {
        await db.close();
        db = null;
    }
}
