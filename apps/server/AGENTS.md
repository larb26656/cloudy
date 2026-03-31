# @cloudy/server

Elysia-based API server with TypeScript.

## Commands

```bash
bun test                                    # Run all tests
bun test src/features/serve/service.test.ts # Single test file
bun test --watch src/features/serve/service.test.ts  # Watch mode

bun run dev                                 # Run in dev mode

bun run db:migrate                          # Run migrations
bun run db:migrate:ideas
bun run db:migrate:clean-meta
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
- Schema in `src/db/migrations/`
- Repository pattern for data access

## Config

- `src/config/env.ts` - Environment variables
- `src/config/resource.config.ts` - Resource paths

```typescript
export const env = {
  ASSISTANT_AI_BASE_PATH: process.env.ASSISTANT_AI_BASE_PATH || "./base-path",
  OC_API_BASE_PATH: process.env.OC_API_BASE_PATH || "http://localhost:4096",
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || "file:local.db",
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
} as const;
```
