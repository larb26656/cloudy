import type { CloudyConfig } from './config';
import { DbClient } from './db/client';
import { Artifact } from './features/artifact/service';
import { MemoryService } from './features/memory/service';
import { MemoryRepository } from './features/memory/repository';
import { Proxy } from './features/proxy/service';
import { IdeaRepository } from './features/idea/repository';
import { IdeaFile } from './features/idea/file/service';
import { Idea } from './features/idea/service';

export let dbClient: DbClient;
export let artifactService: Artifact;
export let memoryService: MemoryService;
export let memoryRepository: MemoryRepository;
export let proxyService: Proxy;
export let ideaRepository: IdeaRepository;
export let ideaFileService: IdeaFile;
export let ideaService: Idea;

export async function initContainer(config: CloudyConfig) {
    dbClient = new DbClient(config);
    await dbClient.init();
    artifactService = new Artifact(config);
    memoryRepository = new MemoryRepository(dbClient.getDb() as any);
    memoryService = new MemoryService(memoryRepository);
    proxyService = new Proxy();
    ideaRepository = new IdeaRepository(dbClient.getDb() as any);
    ideaFileService = new IdeaFile(ideaRepository, config);
    ideaService = new Idea(ideaRepository, ideaFileService);
}