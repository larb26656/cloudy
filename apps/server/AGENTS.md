# @cloudy/server

## Framework
- **Hono** — lightweight TypeScript web framework
- `@hono/node-server` — Node.js adapter
- `hono-openapi` + `@scalar/hono-api-reference` — OpenAPI/Swagger UI

## Project Structure

```
apps/server/
├── src/
│   ├── index.ts           # Main exports
│   ├── server.ts          # Hono app factory
│   ├── cli.ts             # Commander.js entry point
│   ├── container.ts       # DI container (exports all services)
│   ├── config/            # Zod-based configuration
│   ├── db/                # PGlite client + migrations
│   │   ├── client.ts
│   │   └── migrate.ts
│   ├── features/          # Feature modules
│   │   ├── {feature}/     # e.g., memory, idea, artifact
│   │   └── index.ts       # Re-exports all features
│   └── lib/               # Utilities
├── drizzle/               # SQL migrations
└── package.json
```

## Feature Structure

แต่ละ feature มีโครงสร้างแบบ layered architecture:

```
features/{feature}/
├── schema.ts      # Drizzle ORM table definition
├── model.ts       # Zod schemas (request/response validation)
├── repository.ts  # Data access layer (DB operations)
├── service.ts     # Business logic layer
├── service.test.ts # Unit tests (co-located)
└── index.ts       # Hono route handlers
```

### Layer Pattern

```
Routes (index.ts)
    ↓ validates with Zod
Service (service.ts) — business logic, throws 404 if not found
    ↓
Repository (repository.ts) — DB operations, returns DTOs
    ↓
Schema (schema.ts) — Drizzle table definition
```

## Feature File Patterns

### `schema.ts`
```typescript
import { text, timestamp, pgTable } from 'drizzle-orm/pg-core';

export const tableName = pgTable('table_name', {
    id: text('id').primaryKey(),
    field: text('field').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Record = typeof tableName.$inferSelect;
export type NewRecord = typeof tableName.$inferInsert;
```

### `model.ts`
```typescript
import { z } from 'zod';

export const FeatureModel = {
    dto: z.object({
        id: z.string(),
        field: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    }),
    createSchema: z.object({
        id: z.string(),
        field: z.string(),
    }),
    updateSchema: z.object({
        field: z.string().optional(),
    }),
    querySchema: z.object({
        q: z.string().optional(),
    }),
};
```

### `repository.ts`
```typescript
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

export interface RecordDTO { ... }
export interface CreateInput { ... }
export interface Query { ... }

export class FeatureRepository {
    constructor(private db: PgliteDatabase) {}

    async findAll(query?: Query): Promise<RecordDTO[]> { ... }
    async findById(id: string): Promise<RecordDTO | null> { ... }
    async create(input: CreateInput): Promise<RecordDTO> { ... }
    async update(id: string, input: UpdateInput): Promise<RecordDTO> { ... }
    async delete(id: string): Promise<void> { ... }
}
```

### `service.ts`
```typescript
export class FeatureService {
    constructor(private repository: FeatureRepository) {}

    async list(query?: Query): Promise<RecordDTO[]> {
        return this.repository.findAll(query);
    }

    async get(id: string): Promise<RecordDTO> {
        const record = await this.repository.findById(id);
        if (!record) throw new Response('Not found', { status: 404 });
        return record;
    }

    async create(input: CreateInput): Promise<RecordDTO> { ... }
    async update(id: string, input: UpdateInput): Promise<RecordDTO> { ... }
    async delete(id: string): Promise<void> { ... }
}
```

### `service.test.ts`
```typescript
import { mock } from 'vitest-mock-extended';
import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureService } from './service';
import type { FeatureRepository } from './repository';

describe('FeatureService', () => {
    let service: FeatureService;
    let mockRepository: FeatureRepository;

    beforeEach(() => {
        mockRepository = mock<FeatureRepository>();
        service = new FeatureService(mockRepository);
    });

    it('should return records', async () => {
        mockRepository.findAll.mockResolvedValue([...]);
        const result = await service.list();
        expect(result).toHaveLength(1);
    });
});
```

### `index.ts` (Routes)
```typescript
import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { FeatureModel } from './model';
import { featureService } from '../../container';

export const feature = new Hono()
    .get('/', describeRoute({ ... }), validator('query', FeatureModel.querySchema), async (c) => {
        return c.json(await featureService.list(c.req.valid('query')));
    })
    .get('/:id', describeRoute({ ... }), async (c) => {
        return c.json(await featureService.get(c.req.param('id')));
    })
    .post('/', describeRoute({ ... }), validator('json', FeatureModel.createSchema), async (c) => {
        return c.json(await featureService.create(c.req.valid('json')), 201);
    })
    .put('/:id', describeRoute({ ... }), validator('json', FeatureModel.updateSchema), async (c) => {
        return c.json(await featureService.update(c.req.param('id'), c.req.valid('json')));
    })
    .delete('/:id', describeRoute({ ... }), async (c) => {
        await featureService.delete(c.req.param('id'));
        return c.body(null, 204);
    });
```

## Testing

- **Framework**: Vitest + `vitest-mock-extended`
- **Pattern**: Arrange/Act/Assert
- **Location**: `*.test.ts` co-located with source
- **Run**: `pnpm test` (inside apps/server)

### Test Pattern
```typescript
describe('ServiceName', () => {
    let service: ServiceClass;
    let mockRepository: RepositoryInterface;

    beforeEach(() => {
        mockRepository = mock<RepositoryInterface>();
        service = new ServiceClass(mockRepository);
    });

    it('should do something', async () => {
        // Arrange: mockRepository.method.mockResolvedValue(...)
        // Act: const result = await service.method(...)
        // Assert: expect(result).toEqual(...)
    });
});
```

## Adding a New Feature

1. สร้าง `src/features/{feature}/` directory
2. สร้างไฟล์ตาม pattern: `schema.ts` → `model.ts` → `repository.ts` → `service.ts` → `service.test.ts` → `index.ts`
3. Register service in `container.ts`
4. Mount routes in `server.ts`: `app.route('/api/{feature}', featureRoutes)`