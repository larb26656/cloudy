import { createClient, type Client } from '@libsql/client';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { env } from '../config/env';

let db: Client | null = null;

function ensureDataDir() {
    const dbPath = env.DB_DATABASE_URL.replace('file:', '');
    mkdirSync(dirname(dbPath), { recursive: true });
}

export function getDb(): Client {
    if (!db) {
        ensureDataDir();
        db = createClient({
            url: env.DB_DATABASE_URL,
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
