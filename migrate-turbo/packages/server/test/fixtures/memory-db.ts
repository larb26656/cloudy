import { schema, type TestDb, createTestDb, closeTestDb } from "@repo/database";
import { MemoryRepository } from "../../src/features/memory/repository";
import { MemoryService } from "../../src/features/memory/service";
import { createMemoryApp } from "../../src/features/memory";
import type { CreateMemoryInput } from "../../src/features/memory/model";

let app: ReturnType<typeof createMemoryApp>;
let db: TestDb;
let memoryService: MemoryService;

export async function setupMemoryApp() {
  db = await createTestDb();
  const memoryRepository = new MemoryRepository(db.db);
  memoryService = new MemoryService(memoryRepository);
  app = createMemoryApp({ memoryService });
}

export async function teardownMemoryApp() {
  await closeTestDb(db);
}

export async function clearMemories() {
  await db.db.delete(schema.memories);
}

export function getMemoryApp() {
  return app;
}

export async function createMemory(input: CreateMemoryInput) {
  return memoryService.createMemory(input);
}
