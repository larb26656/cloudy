import { IdeaModel } from './features/idea/model'
import { MemoryModel } from './features/memory/model'
import { ArtifactModel } from './features/artifact/model'
import { ServeModel } from './features/serve/model'

export const openapi = {
  openapi: '3.0.0',
  info: {
    title: 'Cloudy API',
    version: '1.0.0',
  },
  paths: {
    '/api/health': {
      get: {
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Health check response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/idea': {
      get: {
        operationId: 'listIdeas',
        tags: ['Ideas'],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'tags', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'in-progress', 'completed', 'archived'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high'] } },
          { name: 'order', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'List of ideas' },
        },
      },
      post: {
        operationId: 'createIdea',
        tags: ['Ideas'],
        requestBody: {
          content: {
            'application/json': {
              schema: IdeaModel.ideaCreateDto,
            },
          },
        },
        responses: {
          '201': { description: 'Idea created' },
        },
      },
    },
    '/api/idea/{path}': {
      get: {
        operationId: 'getIdea',
        tags: ['Ideas'],
        parameters: [{ name: 'path', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Idea details' },
        },
      },
      patch: {
        operationId: 'updateIdeaMeta',
        tags: ['Ideas'],
        parameters: [{ name: 'path', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: IdeaModel.ideaMetaUpdateDto,
            },
          },
        },
        responses: {
          '200': { description: 'Idea updated' },
        },
      },
      delete: {
        operationId: 'deleteIdea',
        tags: ['Ideas'],
        parameters: [{ name: 'path', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Idea deleted' },
        },
      },
    },
    '/api/idea/{path}/touch': {
      patch: {
        operationId: 'touchIdea',
        tags: ['Ideas'],
        parameters: [{ name: 'path', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Touched' },
        },
      },
    },
    '/api/memory': {
      get: {
        operationId: 'listMemories',
        tags: ['Memories'],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'tags', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
          { name: 'order', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'List of memories' },
        },
      },
    },
    '/api/memory/{path}': {
      get: {
        operationId: 'getMemory',
        tags: ['Memories'],
        parameters: [{ name: 'path', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Memory details' },
        },
      },
    },
    '/api/artifact': {
      get: {
        operationId: 'listArtifacts',
        tags: ['Artifacts'],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'tags', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['html', 'pdf', 'image', 'video', 'document'] } },
          { name: 'order', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'List of artifacts' },
        },
      },
    },
    '/api/artifact/{name}': {
      get: {
        operationId: 'getArtifact',
        tags: ['Artifacts'],
        parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Artifact' },
        },
      },
    },
    '/api/serve': {
      get: {
        operationId: 'listSessions',
        tags: ['Serve'],
        responses: {
          '200': { description: 'List of sessions' },
        },
      },
      post: {
        operationId: 'createSession',
        tags: ['Serve'],
        requestBody: {
          content: {
            'application/json': {
              schema: ServeModel.createBody,
            },
          },
        },
        responses: {
          '201': { description: 'Session created' },
        },
      },
    },
    '/api/serve/{key}': {
      get: {
        operationId: 'getSession',
        tags: ['Serve'],
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Session details' },
        },
      },
      put: {
        operationId: 'updateSession',
        tags: ['Serve'],
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: ServeModel.editBody,
            },
          },
        },
        responses: {
          '200': { description: 'Session updated' },
        },
      },
      delete: {
        operationId: 'deleteSession',
        tags: ['Serve'],
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Session deleted' },
        },
      },
    },
    '/api/serve/{key}/files': {
      get: {
        operationId: 'serveSessionFiles',
        tags: ['Serve'],
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Files served' },
        },
      },
    },
  },
} as const

export type OpenAPI = typeof openapi