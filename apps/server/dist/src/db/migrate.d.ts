import { type Client } from '@libsql/client';
export interface MigrationFile {
    version: number;
    filename: string;
    filepath: string;
}
export declare function getMigrationFiles(migrationsDir: string): MigrationFile[];
export declare function getCurrentVersion(db: Client): Promise<number>;
export declare function runMigrations(db: Client, migrationsDir: string): Promise<void>;
export declare function migrate(dbUrl: string, migrateDir?: string): Promise<void>;
