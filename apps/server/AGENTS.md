# @cloudy/server

Elysia-based API server with TypeScript.

## Commands

```bash
bun test                                    # Run all tests
bun test src/features/serve/service.test.ts # Single test file
bun test --watch src/features/serve/service.test.ts  # Watch mode

bun run dev                                 # Run in dev mode

bun run db:migrate                          # Run pending migrations
bun run db:migration:create <name>          # Create new migration file (e.g., add_description_column)
bun run db:migrate:ideas                    # Data migration: markdown files → DB
bun run db:migrate:clean-meta               # Clean YAML frontmatter from .md files
```

## TypeScript

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- `moduleResolution: bundler`
- `target: ESNext`

## Imports

Use named imports from `elysia`:

```typescript
import { Elysia, t } from "elysia";
import { status } from "elysia";

import { IdeaModel } from "./model";
import { ideaRepository } from "./repository";
import type { IdeaQuery } from "./types";
```

Group imports: external → internal (config, db, lib) → local (./model, ./service)

## Error Handling

Use Elysia's `status()` helper:

```typescript
// Good
throw status(404, "File not found" satisfies IdeaModel["fileNotFound"]);

// Bad
throw new Error("File not found");
```

Use `satisfies` for literal constraints.

## Feature Structure

Each feature follows **Model-Service-Repository** pattern:

| File            | Purpose                                           |
| --------------- | ------------------------------------------------- |
| `index.ts`      | Elysia route definitions (imports from container) |
| `model.ts`      | Request/response DTOs using Elysia's `t` schema   |
| `service.ts`    | Business logic (instance class with DI)           |
| `repository.ts` | Database operations (class-based)                 |
| `types.ts`      | TypeScript interfaces/types                       |

### Service Instance Pattern

Services use instance-based design with dependency injection:

```typescript
// service.ts - Use concrete class (no interface needed)
import { IdeaRepository } from "./repository";

export class Idea {
  constructor(protected repository: IdeaRepository) {}

  async getIdea(filePath: string) {
    /* ... */
  }
}
```

### Container (Dependency Injection)

All dependencies are wired in `src/container.ts`:

```typescript
// src/container.ts
import { IdeaRepository } from "./features/idea/repository";
import { Idea } from "./features/idea/service";

const ideaRepository = new IdeaRepository();
export const ideaService = new Idea(ideaRepository);
```

Feature controllers import from container (NOT from local repository):

```typescript
// features/idea/index.ts
import { ideaService } from "../../container"; // ✅ Correct

// ❌ Wrong - don't new up services here
// const ideaService = new Idea(ideaRepository)
```

**Benefits:**

- Single source of truth for dependencies
- Easy to mock in tests: `mock.module('../../container', ...)`
- Services don't need to know about their dependencies' construction

## Naming Conventions

| Pattern      | Example                                             |
| ------------ | --------------------------------------------------- |
| Models       | `IdeaModel` (PascalCase + `Model` suffix)           |
| Services     | `abstract class Idea` (PascalCase abstract class)   |
| Repositories | `IdeaRepository` (PascalCase + `Repository` suffix) |
| DTOs         | `ideaDto` (camelCase + `Dto` suffix)                |

## Schema Definition (Model.ts)

```typescript
import { t, type UnwrapSchema } from "elysia";

// Use distinct name to avoid conflict with type alias
export const ideaModelSchema = {
  ideaDto: t.Object({
    name: t.String(),
    path: t.String(),
  }),
  fileNotFound: t.Literal("File not found"),
} as const;

// Type export shares name but is distinct in type namespace
export const IdeaModel = ideaModelSchema;

export type IdeaModel = {
  [k in keyof typeof ideaModelSchema]: UnwrapSchema<
    (typeof ideaModelSchema)[k]
  >;
};
```

## Testing

See [docs/testing.md](./docs/testing.md) for comprehensive testing guidelines.

### Unit Testing with bun-automock

We use [bun-automock](https://www.npmjs.com/package/bun-automock) for mocking:

```bash
bun add -D bun-automock
```

Services use dependency injection, making them easy to test with mocks:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { mockFn, type MockProxy } from "bun-automock";
import { Idea } from "../../../src/features/idea/service";
import type { IdeaRecord } from "../../../src/features/idea/types";
import type { IdeaRepository } from "../../../src/features/idea/repository";

describe("IdeaService", () => {
  let repository: MockProxy<IdeaRepository>;
  let service: Idea;

  beforeEach(() => {
    repository = mockFn<IdeaRepository>();
    service = new Idea(repository);
  });

  test("should_return_file_list_with_source_idea", async () => {
    // Arrange
    repository.findAll.mockResolvedValue([mockIdeaRecord]);

    // Act
    const result = await service.getFiles();

    // Assert
    expect(result.source).toBe("idea");
    expect(result.files.length).toBe(1);
  });
});
```

- Use `describe` blocks to group related tests
- Use `beforeEach` to reset mock state
- Test files go in `test/features/<feature>/` directory
- Use `MockProxy<T>` type for mocked dependencies
- Use `mockFn<T>()` to create mock instances
- Handle errors with `.rejects.toMatchObject({ code: 404 })`

## API Endpoints

| Prefix          | Description                  |
| --------------- | ---------------------------- |
| `/api/idea`     | Idea management              |
| `/api/memory`   | Memory management            |
| `/api/artifact` | Artifact file serving        |
| `/api/serve`    | File serving with expiration |

## Database

- **Turso** (libSQL)
- Database file stored in `data/` directory (easily mountable in Docker)
- Schema in `src/db/migrations/`
- Repository pattern for data access

### Migration System

Migrations use a simple version-based system stored in `_migration_version` table.

**File naming:** `v{N}_{description}.sql` (e.g., `v1_create_ideas.sql`, `v2_add_description.sql`)

**Commands:**

```bash
bun run db:migrate                    # Run pending migrations
bun run db:migration:create <name>    # Create new migration (auto-increments version)
```

**How it works:**

1. `_migration_version` table stores current version (default 0)
2. Runner scans `src/db/migrations/v*_*.sql` files, parses version from filename
3. Runs only files with version > current version, in order
4. Updates version after each successful migration
5. If already at latest version, prints "Already at latest version (v{N})"

**Docker:** Migrations run automatically on container startup via `entrypoint.sh` (fail-fast — if migration fails, server won't start). Database directory is volume-mapped via `./data:/app/apps/server/data`.

**Creating a new migration:**

```bash
cd apps/server
bun run db:migration:create add_description_column
# → Created: src/db/migrations/v2_add_description_column.sql
# Edit the generated file with your SQL, then run:
bun run db:migrate
```

## Config

- `src/config/env.ts` - Environment variables
- `src/config/resource.config.ts` - Resource paths

```typescript
export const env = {
  ASSISTANT_AI_BASE_PATH: process.env.ASSISTANT_AI_BASE_PATH || "./base-path",
  OC_API_BASE_PATH: process.env.OC_API_BASE_PATH || "http://localhost:4096",
  DB_DATA_DIR: process.env.DB_DATA_DIR || "./data",
  DB_DATABASE_URL: process.env.DB_DATABASE_URL || "file:./data/local.db",
} as const;
```
