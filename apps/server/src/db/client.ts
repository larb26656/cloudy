import { createClient, type Client } from '@libsql/client';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import type { CloudyConfig } from '../config';

export class DbClient {
    private db: Client | null = null;

    constructor(private config: CloudyConfig) {}

    private ensureDataDir() {
        const dbPath = this.config.dbDatabaseUrl.replace('file:', '');
        mkdirSync(dirname(dbPath), { recursive: true });
    }

    getClient(): Client {
        if (!this.db) {
            this.ensureDataDir();
            this.db = createClient({
                url: this.config.dbDatabaseUrl,
            });
        }
        return this.db;
    }

    async close() {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}
