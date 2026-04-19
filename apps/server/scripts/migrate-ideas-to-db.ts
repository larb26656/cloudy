import { createClient } from '@libsql/client';
import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { loadConfig } from '../src/config';

const config = loadConfig();

const client = createClient({
    url: config.dbDatabaseUrl,
});

const IDEA_PATH = config.idea;

async function getIndexFiles(): Promise<string[]> {
    const indexFiles: string[] = [];
    const allPaths = await readdir(IDEA_PATH, { recursive: true });

    const subfolders = new Set<string>();
    for (const filePath of allPaths) {
        if (typeof filePath !== 'string' || filePath.endsWith('/')) continue;
        const parts = filePath.split('/').filter(Boolean);
        if (parts.length >= 1) {
            subfolders.add(parts[0]);
        }
    }

    for (const folder of subfolders) {
        const folderPath = path.join(IDEA_PATH, folder);
        const indexPath = path.join(folderPath, 'index.md');
        try {
            const indexStat = await stat(indexPath);
            if (indexStat.isFile()) {
                indexFiles.push(`${folder}/index.md`);
            }
        } catch {
            continue;
        }
    }

    return indexFiles;
}

function generateId(): string {
    return crypto.randomUUID();
}

async function migrate() {
    console.log('Starting migration of ideas to database...\n');

    const indexFiles = await getIndexFiles();
    console.log(`Found ${indexFiles.length} ideas to migrate\n`);

    let migrated = 0;
    let skipped = 0;

    for (const filePath of indexFiles) {
        const fullPath = path.join(IDEA_PATH, filePath);
        const ideaPath = filePath.split('/')[0];

        try {
            const rawContent = await readFile(fullPath, 'utf-8');
            const { data, content } = matter(rawContent);

            const id = generateId();
            const now = new Date().toISOString();

            const title = data.title || ideaPath;
            const tags = Array.isArray(data.tags) ? JSON.stringify(data.tags) : JSON.stringify([]);
            const status = data.status || 'draft';
            const priority = data.priority || 'medium';
            const createdAt = data.createdAt || now;
            const updatedAt = data.updatedAt || now;

            await client.execute(
                `INSERT INTO ideas (id, title, tags, status, priority, path, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, title, tags, status, priority, filePath, createdAt, updatedAt]
            );

            const plainContent = content.trim();
            const { writeFile } = await import('node:fs/promises');
            await writeFile(fullPath, plainContent, 'utf-8');

            migrated++;
            console.log(`✓ Migrated: ${ideaPath}`);
        } catch (e) {
            skipped++;
            console.log(`✗ Skipped: ${ideaPath} (${e})`);
        }
    }

    console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped`);
}

migrate()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    });
