import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { mkdirSync } from 'fs';
import type { CloudyConfig } from '../config';

export class DbClient {
    private db: PGlite | null = null;
    private drizzle: ReturnType<typeof drizzle> | null = null;

    constructor(private config: CloudyConfig) { }

    private ensureDataDir() {
        mkdirSync(this.config.dbPath, { recursive: true });
    }

    async init(): Promise<void> {
        this.ensureDataDir();
        console.log("db path");
        console.log(this.config.dbPath);
        this.db = new PGlite({ dataDir: this.config.dbPath });
        await this.db.waitReady;
        this.drizzle = drizzle(this.db);
    }

    getDb() {
        if (!this.drizzle) {
            throw new Error('DbClient not initialized. Call init() first.');
        }
        return this.drizzle;
    }

    async close(): Promise<void> {
        await this.db?.close();
        this.db = null;
        this.drizzle = null;
    }
}