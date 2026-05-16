import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { mkdirSync } from 'fs';
import { join } from 'path';

export async function runMigrations(dbPath: string, migrationsDir?: string): Promise<void> {
    mkdirSync(dbPath, { recursive: true });

    const pg = new PGlite({ dataDir: dbPath });
    await pg.waitReady;

    const db = drizzle(pg);

    const migrationsFolder = migrationsDir ?? join(process.cwd(), 'drizzle');

    await migrate(db, {
        migrationsFolder,
    });

    await pg.close();
}