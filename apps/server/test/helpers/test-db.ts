import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { join } from 'path'

export interface TestDb {
    pg: PGlite
    db: ReturnType<typeof drizzle>
}

export async function createTestDb(): Promise<TestDb> {
    const pg = new PGlite()
    await pg.waitReady
    const db = drizzle(pg)
    const migrationsFolder = join(process.cwd(), 'drizzle')
    await migrate(db, { migrationsFolder })
    return { pg, db }
}

export async function closeTestDb(testDb: TestDb): Promise<void> {
    await testDb.pg.close()
}