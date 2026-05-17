import { MemoryRepository } from '../../src/features/memory/repository'
import { MemoryService } from '../../src/features/memory/service'
import { createMemoryApp } from '../../src/features/memory'
import { memories } from '../../src/features/memory/schema'
import { createTestDb, type TestDb } from '../helpers/test-db'

let app: ReturnType<typeof createMemoryApp>
let db: TestDb
let memoryService: MemoryService

export async function setupMemoryApp() {
    db = await createTestDb()

    const memoryRepository = new MemoryRepository(db.db)
    memoryService = new MemoryService(memoryRepository)
    app = createMemoryApp({ memoryService })
}

export async function teardownMemoryApp() {
    await db.pg.close()
}

export async function clearMemories() {
    await db.db.delete(memories)
}

export function getMemoryApp() {
    return app
}

export async function createMemory(input: { id: string; title?: string; content: string; tags?: string[] }) {
    return memoryService.createMemory(input)
}