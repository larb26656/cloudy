import type { TabDataMap } from "@/features/home/tabs/template";
import type { Workspace } from "@/lib/cloudy/workspaces";
import type { RecentChatSession } from "@/types";

/**
 * Serializable instruction to open a session as a tab. Built by the pet
 * surfaces and either applied locally (`FloatingPet` → `openTab`) or relayed
 * to the main window through the desktop pet bridge.
 */
export type SessionTabPayload = { type: "chat"; data: TabDataMap["chat"] };

/**
 * Resolves a chat session to the regular chat tab payload.
 */
export function openSessionTab(
  session: RecentChatSession,
  workspaces: Pick<Workspace, "id" | "type" | "directory">[],
): SessionTabPayload {
  const dir = session.directory;
  const workspace = workspaces.find((w) => w.directory === dir);
  return {
    type: "chat",
    data: {
      providerId: session.providerId,
      sessionId: session.id,
      workspaceId: workspace?.id ?? null,
      directory: dir,
      sessionName: session.title || "New Chat",
    },
  };
}

export function createSessionTabPayload({
  providerId,
  sessionId,
  directory,
  sessionName,
  workspaceId = null,
}: {
  providerId: string;
  sessionId: string;
  directory: string;
  sessionName: string;
  workspaceId?: string | null;
}): SessionTabPayload {
  return {
    type: "chat",
    data: { providerId, sessionId, directory, sessionName, workspaceId },
  };
}
