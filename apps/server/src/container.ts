import type { CloudyConfig } from './config/loader';
import { DbClient } from './db/client';
import { Artifact } from './features/artifact/service';
import { Memory } from './features/memory/service';
import { ProxyHandler } from './features/proxy/index';
import { IdeaRepository } from './features/idea/repository';
import { IdeaFile } from './features/idea/file/service';
import { Idea } from './features/idea/service';

export let dbClient: DbClient;
export let artifactService: Artifact;
export let memoryService: Memory;
export let proxyHandler: ProxyHandler;
export let ideaRepository: IdeaRepository;
export let ideaFileService: IdeaFile;
export let ideaService: Idea;

export function initContainer(config: CloudyConfig) {
    dbClient = new DbClient(config);
    artifactService = new Artifact(config);
    memoryService = new Memory(config);
    proxyHandler = new ProxyHandler(config);
    ideaRepository = new IdeaRepository(dbClient.getClient());
    ideaFileService = new IdeaFile(ideaRepository, config);
    ideaService = new Idea(ideaRepository, ideaFileService);
}
