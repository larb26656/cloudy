import type { CloudyConfig } from './config';
import { DbClient } from './db/client';
import { Artifact } from './features/artifact/service';
import { Memory } from './features/memory/service';
import { Proxy } from './features/proxy/service';
import { IdeaRepository } from './features/idea/repository';
import { IdeaFile } from './features/idea/file/service';
import { Idea } from './features/idea/service';

export let dbClient: DbClient;
export let artifactService: Artifact;
export let memoryService: Memory;
export let proxyService: Proxy;
export let ideaRepository: IdeaRepository;
export let ideaFileService: IdeaFile;
export let ideaService: Idea;

export function initContainer(config: CloudyConfig) {
    dbClient = new DbClient(config);
    artifactService = new Artifact(config);
    memoryService = new Memory(config);
    proxyService = new Proxy();
    ideaRepository = new IdeaRepository(dbClient.getClient());
    ideaFileService = new IdeaFile(ideaRepository, config);
    ideaService = new Idea(ideaRepository, ideaFileService);
}
