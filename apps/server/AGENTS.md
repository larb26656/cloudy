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
├── test/
│   └── fixtures/          # Test fixtures (e.g., memory-db.ts)
├── drizzle/               # SQL migrations
└── package.json
```

## Feature Structure

Each feature has a layered architecture structure:

```
features/{feature}/
├── schema.ts                    # Drizzle ORM table definition
├── model.ts                    # Zod schemas + Type exports
├── repository.ts               # Data access layer (DB operations)
├── service.ts                  # Business logic layer
├── service.test.ts             # Unit tests (co-located)
├── {feature}.integration.test.ts # Integration tests (co-located)
└── index.ts                    # Hono route handlers (factory function)
```

### Layer Pattern

```
Routes (index.ts)
    ↓ validates with Zod
Service (service.ts) — business logic, throws HTTPException 404 if not found
    ↓
Repository (repository.ts) — DB operations, returns DTOs
    ↓
Schema (schema.ts) — Drizzle table definition
```

## Feature File Patterns

### `schema.ts`

```typescript
import { text, timestamp, pgTable } from "drizzle-orm/pg-core";

export const tableName = pgTable("table_name", {
  id: text("id").primaryKey(),
  field: text("field").notNull(),
  tags: text("tags").array().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Record = typeof tableName.$inferSelect;
export type NewRecord = typeof tableName.$inferInsert;
```

### `model.ts`

```typescript
import { z } from "zod";

export const FeatureModel = {
  dto: z.object({
    id: z.string(),
    field: z.string(),
    tags: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  querySchema: z.object({
    q: z.string().optional(),
    tags: z.array(z.string()).optional(),
    order: z.string().optional(),
  }),
  createSchema: z.object({
    id: z.string(),
    field: z.string(),
    tags: z.array(z.string()).optional(),
  }),
  updateSchema: z.object({
    field: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
};

export type CreateFeatureInput = z.input<typeof FeatureModel.createSchema>;
export type UpdateFeatureInput = z.input<typeof FeatureModel.updateSchema>;
export type FeatureDto = z.infer<typeof FeatureModel.dto>;
export type FeatureQuery = z.input<typeof FeatureModel.querySchema>;
```

### `repository.ts`

```typescript
import { eq, like, and, or, asc, desc, arrayContains } from 'drizzle-orm';
import { tableName } from './schema';
import { AppDatabase } from '@server/db/client';
import type { CreateFeatureInput, FeatureQuery, FeatureDto, UpdateFeatureInput } from './model';

function toDateString(value: unknown): string {
    if (value instanceof Date) {
        return value.toISOString();
    }
    return String(value);
}

export class FeatureRepository {
    constructor(private db: AppDatabase) { }

    async findAll(query?: FeatureQuery): Promise<FeatureDto[]> { ... }
    async findById(id: string): Promise<FeatureDto | null> { ... }
    async create(input: CreateFeatureInput): Promise<FeatureDto> { ... }
    async update(id: string, input: UpdateFeatureInput): Promise<FeatureDto> { ... }
    async delete(id: string): Promise<void> { ... }
}
```

### `service.ts`

```typescript
import { HTTPException } from 'hono/http-exception';
import type { FeatureDto } from './model';
import type { FeatureQuery, CreateFeatureInput, UpdateFeatureInput } from './model';
import { FeatureRepository } from './repository';

export class FeatureService {
    constructor(private repository: FeatureRepository) { }

    async listFeatures(query?: FeatureQuery): Promise<FeatureDto[]> {
        return this.repository.findAll(query);
    }

    async getFeature(id: string): Promise<FeatureDto> {
        const record = await this.repository.findById(id);
        if (!record) {
            throw new HTTPException(404, { message: `Feature with ID ${id} not found` });
        }
        return record;
    }

    async createFeature(input: CreateFeatureInput): Promise<FeatureDto> { ... }
    async updateFeature(id: string, input: UpdateFeatureInput): Promise<FeatureDto> { ... }
    async deleteFeature(id: string): Promise<void> { ... }
}
```

### `service.test.ts`

```typescript
import { mock, MockProxy } from 'vitest-mock-extended';
import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureService } from './service';
import { HTTPException } from 'hono/http-exception';
import { FeatureRepository } from './repository';
import { FeatureDto } from './model';

describe('FeatureService', () => {
    let service: FeatureService;
    let mockRepository: MockProxy<FeatureRepository>;

    beforeEach(() => {
        mockRepository = mock<FeatureRepository>();
        service = new FeatureService(mockRepository);
    });

    it('should return records', async () => {
        mockRepository.findAll.mockResolvedValue([...]);
        const result = await service.listFeatures();
        expect(result).toHaveLength(1);
    });
});
```

### `index.ts` (Routes Factory)

```typescript
import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { FeatureModel } from './model';
import { FeatureService } from './service';

export function createFeatureApp({ featureService }: { featureService: FeatureService }) {
    return new Hono()
        .get('/',
            describeRoute({ ... }),
            validator('query', FeatureModel.querySchema),
            async (c) => {
                const query = c.req.valid('query');
                return c.json(await featureService.listFeatures(query));
            })
        .get('/:id',
            describeRoute({ ... }),
            async (c) => {
                const { id } = c.req.param();
                return c.json(await featureService.getFeature(id));
            })
        .post('/',
            describeRoute({ ... }),
            validator('json', FeatureModel.createSchema),
            async (c) => {
                const input = c.req.valid('json');
                return c.json(await featureService.createFeature(input), 201);
            })
        .put('/:id',
            describeRoute({ ... }),
            validator('json', FeatureModel.updateSchema),
            async (c) => {
                const { id } = c.req.param();
                const input = c.req.valid('json');
                return c.json(await featureService.updateFeature(id, input));
            })
        .delete('/:id',
            describeRoute({ ... }),
            async (c) => {
                const { id } = c.req.param();
                await featureService.deleteFeature(id);
                return c.body(null, 204);
            });
}
```

### `{feature}.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFeatureApp,
  teardownFeatureApp,
  clearFeatures,
  getFeatureApp,
  createFeature,
} from "../../../test/fixtures/feature-db";

describe("Feature API", () => {
  beforeAll(async () => {
    await setupFeatureApp();
  });
  afterAll(async () => {
    await teardownFeatureApp();
  });
  beforeEach(async () => {
    await clearFeatures();
  });

  it("should return empty array when no features exist", async () => {
    const app = getFeatureApp();
    const res = await app.request("/");
    expect(res.status).toBe(200);
  });
});
```

## Testing

| Type        | Framework              | Location                           | Run command                      |
| ----------- | ---------------------- | ---------------------------------- | -------------------------------- |
| Unit        | Vitest + mock-extended | `*.test.ts` co-located             | `pnpm test` (inside apps/server) |
| Integration | Vitest (supertest)     | `*.integration.test.ts` co-located | `pnpm test`                      |

### Test Fixtures Pattern

```typescript
// test/fixtures/{feature}-db.ts
import { ... } from 'vitest';
import { createFeatureApp } from '../../features/{feature}';
import { FeatureService } from '../../features/{feature}/service';

let db: AppDatabase;
let featureService: FeatureService;

export async function setupFeatureApp() { ... }
export async function teardownFeatureApp() { ... }
export async function clearFeatures() { ... }
export function getFeatureApp() { ... }
export async function createFeature(input: CreateFeatureInput) { ... }
```

## Adding a New Feature

1. Create `src/features/{feature}/` directory
2. Create files following the pattern: `schema.ts` → `model.ts` → `repository.ts` → `service.ts` → `service.test.ts` → `index.ts`
3. Create test fixtures in `test/fixtures/{feature}-db.ts`
4. Register service in `container.ts`
5. Mount routes in `server.ts`: `app.route('/api/{feature}', createFeatureApp({ featureService }))`

## Utils

Use utils function in `src/utils` frist when the logic already exist instead inline function
