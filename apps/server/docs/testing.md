# Testing Guide - @cloudy/server

## Testing Overview

| Type            | Description                                                | Speed  | Use Case                          |
| --------------- | ---------------------------------------------------------- | ------ | --------------------------------- |
| **Unit**        | Test individual functions/methods with mocked dependencies | Fast   | Business logic, utility functions |
| **Integration** | Test API endpoints with mocked repository                  | Medium | CRUD operations, API flows        |
| **E2E**         | Test entire server running                                 | Slow   | Critical user journeys            |

## Bun Test Runner

```bash
bun test                          # Run all tests
bun test src/features/serve/service.test.ts  # Single file
bun test --watch src/features/serve/service.test.ts  # Watch mode
```

## Project Testing Structure

```
src/
└── features/
    └── idea/
        ├── index.ts          # Controller (Elysia routes)
        ├── service.ts        # Service (business logic)
        ├── model.ts          # Schema + types
        └── repository.ts     # Database operations

test/
└── features/
    └── idea/
        └── service.test.ts   # Unit tests for service
```

## Mocking Library

We use [bun-automock](https://www.npmjs.com/package/bun-automock) for creating mocks:

```bash
bun add -D bun-automock
```

> **Note:** bun-automock v0.2.7 may have a bug where the `dist` folder is not included in the npm package. If you get import errors, build from source:
> ```bash
> git clone https://github.com/jbigorra/bun-automock.git /tmp/bun-automock
> cd /tmp/bun-automock && bun install && bun run build
> cp -r dist <project>/node_modules/bun-automock/
> ```

## Unit Testing Service

### Setup with bun-automock

```bash
bun add -D bun-automock
```

### Example: Service Unit Test

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { mockFn, type MockProxy } from "bun-automock";
import { Idea } from "../../../src/features/idea/service";
import type { IdeaRecord } from "../../../src/features/idea/types";
import type { IdeaRepository } from "../../../src/features/idea/repository";
import type { IdeaFile } from "../../../src/features/idea/file/service";

const mockIdeaRecord: IdeaRecord = {
    id: "idea-123",
    title: "Test Idea",
    path: "test-idea/index.md",
    status: "draft",
    priority: "medium",
    tags: ["test", "idea"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
};

describe("IdeaService", () => {
    let repository: MockProxy<IdeaRepository>;
    let ideaFile: MockProxy<IdeaFile>;
    let service: Idea;

    beforeEach(() => {
        repository = mockFn<IdeaRepository>();
        ideaFile = mockFn<IdeaFile>();
        service = new Idea(repository, ideaFile);
    });

    test("should_return_list_of_ideas", async () => {
        // Arrange
        repository.findAll.mockResolvedValue([mockIdeaRecord]);
        ideaFile.getFile.mockResolvedValue({ name: "index.md", path: mockIdeaRecord.path, content: "# Test" });

        // Act
        const result = await service.listIdeas();

        // Assert
        expect(result.length).toBe(1);
        expect(result[0]!.name).toBe("test-idea");
    });

    test("should_throw_404_when_idea_not_found", async () => {
        // Arrange
        repository.findByPath.mockResolvedValue(null);

        // Act & Assert
        await expect(service.getIdea("non-existent/index.md")).rejects.toMatchObject({
            code: 404,
        });
    });
});
```

### Key Points

- `MockProxy<T>` - Type for the mocked repository
- `mockFn<T>()` - Creates a new mock instance (called in `beforeEach`)
- `.mockResolvedValue(value)` - Set mock to return a resolved Promise
- `.spy()` - Get the underlying mock function for assertions

## Integration Testing with Eden Treaty

### Setup

```bash
bun add @elysiajs/eden
```

### Example: Integration Test with Repository Mock

```typescript
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { treaty } from "@elysiajs/eden";
import { mockFn, type MockProxy } from "bun-automock";
import { idea } from "../../../src/features/idea";
import type { IdeaRepository } from "../../../src/features/idea/repository";
import type { IdeaRecord } from "../../../src/features/idea/types";

const mockIdeaRecord: IdeaRecord = {
    id: "idea-123",
    title: "Test Idea",
    path: "test-idea/index.md",
    status: "draft",
    priority: "medium",
    tags: ["test", "idea"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
};

describe("Idea Controller Integration", () => {
    let repository: MockProxy<IdeaRepository>;
    let app: Elysia;
    let api: ReturnType<typeof treaty<Elysia>>;

    beforeAll(() => {
        repository = mockFn<IdeaRepository>();
        repository.findByPath.mockResolvedValue(mockIdeaRecord);

        app = new Elysia()
            .derive(() => ({
                ideaRepository: repository,
            }))
            .use(idea)
            .listen(0);

        api = treaty(app);
    });

    afterAll(() => app.stop());

    describe("GET /api/idea/:path", () => {
        test("should return idea by path", async () => {
            // Act
            const { data, error } = await api.idea["test-idea"].get();

            // Assert
            expect(error).toBeUndefined();
            expect(data.value.name).toBe("test-idea");
        });

        test("should return 404 for nonexistent idea", async () => {
            // Arrange
            repository.findByPath.mockResolvedValue(null);

            // Act
            const { error } = await api.idea["nonexistent"].get();

            // Assert
            expect(error?.value).toBe("File not found");
        });
    });
});
```

## Repository Pattern with Dependency Injection

### Service Constructor

```typescript
// src/features/idea/service.ts
import { IdeaRepository } from "./repository";
import { IdeaFile } from "./file/service";

export class Idea {
    constructor(
        protected repository: IdeaRepository,
        protected ideaFile: IdeaFile,
    ) {}

    async getIdea(filePath: string) {
        // Implementation...
    }
}
```

### Container (Global DI)

All dependencies are wired in `src/container.ts`:

```typescript
// src/container.ts
import { IdeaRepository } from "./features/idea/repository";
import { IdeaFile } from "./features/idea/file/service";
import { Idea } from "./features/idea/service";

const ideaRepository = new IdeaRepository();
const ideaFile = new IdeaFile(ideaRepository);
export const ideaService = new Idea(ideaRepository, ideaFile);
```

## Mock Patterns

### Mock with bun-automock

```typescript
import { mockFn, type MockProxy } from "bun-automock";

interface UserRepository {
    findById(id: string): Promise<User | null>;
    create(data: CreateUser): Promise<User>;
}

const repository = mockFn<UserRepository>();
repository.findById.mockResolvedValue({ id: "1", name: "Test" });
repository.create.mockResolvedValue({ id: "2", name: "New" });
```

### Mock Methods

| Method                     | Example                              | Description                |
| -------------------------- | ------------------------------------ | -------------------------- |
| `.mockResolvedValue(v)`     | `.mockResolvedValue(user)`            | Stub async to return value |
| `.mockResolvedValueOnce(v)` | `.mockResolvedValueOnce(null)`       | Stub for one call          |
| `.mockRejectedValue(err)`  | `.mockRejectedValue(new Error())`    | Stub to throw error       |
| `.mockImplementation(fn)`   | `.mockImplementation(async () => {})` | Stub with custom function  |

### Spying

```typescript
test("should_call_repository", async () => {
    // Arrange
    repository.findByPath.mockResolvedValue(mockIdea);

    // Act
    await service.getIdea("test-idea");

    // Assert - use .spy() for assertions
    expect(repository.findByPath.spy()).toHaveBeenCalledWith("test-idea/index.md");
});
```

## Error Testing

```typescript
test("should_throw_404_when_idea_not_found", async () => {
    // Arrange
    repository.findByPath.mockResolvedValue(null);

    // Act & Assert
    await expect(service.getIdea("nonexistent")).rejects.toMatchObject({
        code: 404,
    });
});

test("should_throw_400_for_invalid_input", async () => {
    // Act & Assert
    await expect(service.createFile("path", "")).rejects.toMatchObject({
        code: 400,
    });
});
```

## Lifecycle Hooks

```typescript
describe("Feature", () => {
    beforeAll(() => {
        // Run once before all tests
    });

    beforeEach(() => {
        // Run before each test - reset mocks here
        repository = mockFn<IdeaRepository>();
        service = new Idea(repository);
    });

    afterEach(() => {
        // Cleanup after each test
    });

    afterAll(() => {
        // Cleanup after all tests
    });
});
```

## Test Naming Convention

```typescript
test("should_return_user_when_found", async () => { /* ... */ });
test("should_throw_404_when_user_not_found", async () => { /* ... */ });
test("should_create_file_with_correct_content", async () => { /* ... */ });
```

## Test Ordering Convention

Within each `describe` block, order test cases as follows:

1. **Success case** (happy path) - first
2. **Error cases** - sorted by HTTP status code:
   - 400 (validation errors) before 404 (not found errors)
3. **Spy/assertion tests** - last (e.g., `should_call_repository_with_correct_args`)

### Example: Method Test Ordering

```typescript
describe('updateFile', () => {
    test('should_update_file_and_return_correct_response', async () => { /* success */ });
    
    test('should_throw_400_when_file_path_invalid', async () => { /* validation */ });
    test('should_throw_404_when_idea_not_found', async () => { /* not found */ });
    test('should_throw_404_when_file_not_found', async () => { /* not found */ });
    
    test('should_call_ideaRepository_exists_with_correct_path', async () => { /* spy */ });
});
```

## AAA Pattern (Arrange - Act - Assert)

Every test should follow this pattern:

```typescript
test("should_return_user_when_found", async () => {
    // Arrange - Set up test data and mock dependencies
    repository.findById.mockResolvedValue({ id: "1", name: "Test User" });

    // Act - Execute the action being tested
    const result = await service.getUserById("1");

    // Assert - Verify the expected outcome
    expect(result.name).toBe("Test User");
});
```

## Coverage

```bash
bun test --coverage
```

## Best Practices

| Do                                          | Don't                                    |
| ------------------------------------------- | ---------------------------------------- |
| Write AAA comments in every test            | Skip comments and lose track of sections |
| **Arrange** - Set up mocks in beforeEach    | Duplicate arrange in test                |
| **Act** - Call a single method              | Multiple actions in one test             |
| **Assert** - Check relevant outcomes        | Assert unrelated things                  |
| Test names: `should_<expected>_<condition>` | Vague names like "test1", "it works"     |
| Unit test services (business logic)         | Test thin controllers directly           |
| Integration test with mocked repository     | Call real database in unit tests         |
| Use `describe` to group related tests       | Write long monolithic tests              |
| Use `beforeEach` to reset state             | Leave state between tests                |
| Mock external dependencies                  | Hit real external APIs                   |

## When to Use Each Type

- **Unit Test**: Complex business logic in services
- **Integration Test**: API endpoints (controller + service), use mocked repository
- **E2E Test**: Full server with real database for critical flows