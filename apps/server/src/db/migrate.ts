import { createClient, type Client } from '@libsql/client';
import { readdirSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const MIGRATIONS_DIR = join(import.meta.dir, 'migrations');

export interface MigrationFile {
    version: number;
    filename: string;
    filepath: string;
}

export function getMigrationFiles(migrationsDir: string = MIGRATIONS_DIR): MigrationFile[] {
    const files = readdirSync(migrationsDir);
    const migrations: MigrationFile[] = [];

    for (const file of files) {
        const match = file.match(/^v(\d+)_.+\.sql$/);
        if (match) {
            migrations.push({
                version: parseInt(match[1]!, 10),
                filename: file,
                filepath: join(migrationsDir, file),
            });
        }
    }

    return migrations.sort((a, b) => a.version - b.version);
}

export async function getCurrentVersion(db: Client): Promise<number> {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS _migration_version (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            version INTEGER NOT NULL DEFAULT 0
        )
    `);

    const result = await db.execute('SELECT version FROM _migration_version WHERE id = 1');
    if (result.rows.length === 0) {
        await db.execute('INSERT INTO _migration_version (id, version) VALUES (1, 0)');
        return 0;
    }
    return result.rows[0]!.version as number;
}

async function setVersion(db: Client, version: number): Promise<void> {
    await db.execute({
        sql: 'UPDATE _migration_version SET version = ? WHERE id = 1',
        args: [version],
    });
}

async function runMigration(db: Client, migration: MigrationFile): Promise<void> {
    const sql = readFileSync(migration.filepath, 'utf-8');
    console.log(`→ Running ${migration.filename}...`);

    const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        await db.execute(statement);
    }

    await setVersion(db, migration.version);
    console.log(`  ✓ Done (v${migration.version})`);
}

export async function runMigrations(db: Client, migrationsDir: string = MIGRATIONS_DIR): Promise<void> {
    const currentVersion = await getCurrentVersion(db);
    const migrations = getMigrationFiles(migrationsDir);

    if (migrations.length === 0) {
        console.log('No migration files found.');
        return;
    }

    const pending = migrations.filter((m) => m.version > currentVersion);

    if (pending.length === 0) {
        console.log(`Already at latest version (v${currentVersion})`);
        return;
    }

    console.log(`Current version: v${currentVersion}`);
    console.log(`Pending migrations: ${pending.length}\n`);

    for (const migration of pending) {
        await runMigration(db, migration);
    }

    const latestVersion = pending[pending.length - 1]!.version;
    console.log(`\nMigration complete. Current version: v${latestVersion}`);
}

export async function migrate(dbUrl: string): Promise<void> {
    const dbPath = dbUrl.replace('file:', '');
    mkdirSync(dirname(dbPath), { recursive: true });

    const db = createClient({ url: dbUrl });
    await runMigrations(db);
    await db.close();
}