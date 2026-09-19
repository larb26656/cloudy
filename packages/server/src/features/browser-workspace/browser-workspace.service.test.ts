import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  BROWSER_WORKSPACE_ID,
  createBrowserWorkspaceService,
} from "./browser-workspace.service";
import type { WorkspaceDto } from "../workspaces/workspaces.model";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository";
import {
  browserAgentsTemplate,
  browserOpencodeTemplate,
} from "./browser-workspace.templates";
import { WorkspaceConflictError } from "../workspaces/workspaces.errors";

function makeWorkspace(overrides: Partial<WorkspaceDto> = {}): WorkspaceDto {
  const now = new Date("2026-01-01T00:00:00Z");
  return {
    id: BROWSER_WORKSPACE_ID,
    name: "Browser",
    color: "#3B82F6",
    type: "agent",
    directory: "/tmp/browser",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeRepo(seed: WorkspaceDto[] = []): WorkspacesRepository {
  const store = new Map(seed.map((workspace) => [workspace.id, workspace]));
  return {
    list: () => [...store.values()],
    findById: (id) => store.get(id) ?? null,
    findByDirectory: (directory) =>
      [...store.values()].find(
        (workspace) => workspace.directory === directory,
      ) ?? null,
    create: (input) => {
      const workspace = makeWorkspace(input);
      store.set(workspace.id, workspace);
      return workspace;
    },
    update: () => null,
    delete: () => false,
  };
}

describe("BrowserWorkspaceService", () => {
  const tempDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it("returns uninitialized when the fixed workspace is absent", () => {
    const service = createBrowserWorkspaceService(
      makeRepo(),
      "/tmp/workspaces",
    );
    expect(service.getStatus()).toEqual({ initialized: false });
  });

  it("creates the reserved directory, templates, and agent workspace", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "cloudy-browser-"));
    tempDirectories.push(root);
    const extensionWorkspaceDir = path.join(root, "extensions");
    const service = createBrowserWorkspaceService(
      makeRepo(),
      extensionWorkspaceDir,
    );

    const result = await service.initialize();

    const directory = path.join(extensionWorkspaceDir, "browser");
    expect(result).toMatchObject({
      created: true,
      status: {
        initialized: true,
        agent: "browser",
        workspace: {
          id: BROWSER_WORKSPACE_ID,
          type: "agent",
          directory,
        },
      },
    });
    await expect(
      readFile(path.join(directory, "AGENTS.md"), "utf8"),
    ).resolves.toBe(browserAgentsTemplate);
    await expect(
      readFile(path.join(directory, "opencode.json"), "utf8"),
    ).resolves.toBe(browserOpencodeTemplate);
  });

  it("does not overwrite existing template files while registering a missing workspace", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "cloudy-browser-"));
    tempDirectories.push(root);
    const directory = path.join(root, "workspaces", "browser");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "AGENTS.md"), "custom agents", "utf8");
    await writeFile(
      path.join(directory, "opencode.json"),
      "custom config",
      "utf8",
    );
    const service = createBrowserWorkspaceService(
      makeRepo(),
      path.join(root, "workspaces"),
    );

    await service.initialize();

    await expect(
      readFile(path.join(directory, "AGENTS.md"), "utf8"),
    ).resolves.toBe("custom agents");
    await expect(
      readFile(path.join(directory, "opencode.json"), "utf8"),
    ).resolves.toBe("custom config");
  });

  it("returns the fixed workspace unchanged without touching files", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "cloudy-browser-"));
    tempDirectories.push(root);
    const existing = makeWorkspace({ name: "Custom", directory: "/custom" });
    const service = createBrowserWorkspaceService(makeRepo([existing]), root);

    await expect(service.initialize()).resolves.toEqual({
      created: false,
      status: { initialized: true, workspace: existing, agent: "browser" },
    });
  });

  it("rejects a different workspace registered at the reserved directory", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "cloudy-browser-"));
    tempDirectories.push(root);
    const extensionWorkspaceDir = path.join(root, "extensions");
    const service = createBrowserWorkspaceService(
      makeRepo([
        makeWorkspace({
          id: "other-workspace",
          directory: path.join(extensionWorkspaceDir, "browser"),
        }),
      ]),
      extensionWorkspaceDir,
    );

    await expect(service.initialize()).rejects.toBeInstanceOf(
      WorkspaceConflictError,
    );
  });
});
