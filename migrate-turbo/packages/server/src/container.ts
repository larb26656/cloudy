import type { CloudyConfig } from './config';
import { DbClient } from '@repo/database';
import { ArtifactService } from './features/artifact/service';
import { MemoryService } from './features/memory/service';
import { MemoryRepository } from './features/memory/repository';
import { ProxyService } from './features/proxy/service';
import { IdeaRepository } from './features/idea/repository';
import { IdeaFile } from './features/idea/file/service';
import { IdeaService } from './features/idea/service';

export let dbClient: DbClient;
export let artifactService: ArtifactService;
export let memoryService: MemoryService;
export let memoryRepository: MemoryRepository;
export let proxyService: ProxyService;
export let ideaRepository: IdeaRepository;
export let ideaFileService: IdeaFile;
export let ideaService: IdeaService;

export async function initContainer(config: CloudyConfig) {
    dbClient = new DbClient(config);
    await dbClient.init();
    artifactService = new ArtifactService(config);
    const db = dbClient.getDb();
    memoryRepository = new MemoryRepository(db);
    memoryService = new MemoryService(memoryRepository);
    proxyService = new ProxyService();
    ideaRepository = new IdeaRepository(db);
    ideaFileService = new IdeaFile(ideaRepository, config);
    ideaService = new IdeaService(ideaRepository, ideaFileService);
}