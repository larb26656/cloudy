import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BrowserWorkspaceStatus } from "./browser-workspace.model";
import {
  browserAgentsTemplate,
  browserOpencodeTemplate,
} from "./browser-workspace.templates";
import { WorkspaceConflictError } from "../workspaces/workspaces.errors";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository";

export const BROWSER_WORKSPACE_ID = "browser-workspace";
const BROWSER_AGENT = "browser";
const BROWSER_WORKSPACE_NAME = "Browser";
const BROWSER_WORKSPACE_COLOR = "#3B82F6";

async function writeIfAbsent(file: string, content: string): Promise<void> {
  try {
    await writeFile(file, content, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
}

export function createBrowserWorkspaceService(
  repo: WorkspacesRepository,
  extensionWorkspaceDir: string,
) {
  const getStatus = (): BrowserWorkspaceStatus => {
    const workspace = repo.findById(BROWSER_WORKSPACE_ID);
    if (!workspace) return { initialized: false };
    return { initialized: true, workspace, agent: BROWSER_AGENT };
  };

  const initialize = async (): Promise<{
    status: BrowserWorkspaceStatus;
    created: boolean;
  }> => {
    const existing = getStatus();
    if (existing.initialized) return { status: existing, created: false };

    const directory = path.resolve(extensionWorkspaceDir, BROWSER_AGENT);
    if (repo.findByDirectory(directory)) {
      throw new WorkspaceConflictError(directory);
    }

    await mkdir(directory, { recursive: true });
    await writeIfAbsent(
      path.join(directory, "AGENTS.md"),
      browserAgentsTemplate,
    );
    await writeIfAbsent(
      path.join(directory, "opencode.json"),
      browserOpencodeTemplate,
    );

    const workspace = repo.create({
      id: BROWSER_WORKSPACE_ID,
      name: BROWSER_WORKSPACE_NAME,
      color: BROWSER_WORKSPACE_COLOR,
      type: "agent",
      directory,
    });
    return {
      status: { initialized: true, workspace, agent: BROWSER_AGENT },
      created: true,
    };
  };

  return { getStatus, initialize };
}

export type BrowserWorkspaceService = ReturnType<
  typeof createBrowserWorkspaceService
>;
