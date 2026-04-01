import { readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(import.meta.dir, '..', 'src', 'db', 'migrations');

const name = process.argv[2];

if (!name) {
    console.error('Usage: bun run scripts/create-migration.ts <migration_name>');
    console.error('Example: bun run scripts/create-migration.ts add_description_column');
    process.exit(1);
}

if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    console.error('Migration name must be lowercase snake_case (e.g., add_description_column)');
    process.exit(1);
}

function getNextVersion(): number {
    const files = readdirSync(MIGRATIONS_DIR);
    let maxVersion = 0;

    for (const file of files) {
        const match = file.match(/^v(\d+)_.+\.sql$/);
        if (match) {
            const version = parseInt(match[1]!, 10);
            if (version > maxVersion) {
                maxVersion = version;
            }
        }
    }

    return maxVersion + 1;
}

const nextVersion = getNextVersion();
const filename = `v${nextVersion}_${name}.sql`;
const filepath = join(MIGRATIONS_DIR, filename);

writeFileSync(filepath, `-- Migration: v${nextVersion} ${name}\n\n`);

console.log(`Created: src/db/migrations/${filename}`);
