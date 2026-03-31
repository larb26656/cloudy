import { IdeaRepository } from './features/idea/repository'
import { Idea } from './features/idea/service'
import { IdeaFile } from './features/idea/file/service'

const ideaRepository = new IdeaRepository()
export const ideaFileService = new IdeaFile(ideaRepository)
export const ideaService = new Idea(ideaRepository, ideaFileService)
