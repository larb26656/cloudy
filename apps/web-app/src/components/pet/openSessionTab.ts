import type { TabDataMap } from "@/features/home/tabs/template";
import type { Workspace } from "@/lib/cloudy/workspaces";
import type { RecentChatSession } from "@/types";

/**
 * Serializable instruction to open a session as a tab. Built by the pet
 * surfaces and either applied locally (`FloatingPet` → `openTab`) or relayed
 * to the main window through the desktop pet bridge.
 */
export type SessionTabPayload =
  | { type: "chat"; data: TabDataMap["chat"] }
  | { type: "bot-chat"; data: TabDataMap["bot-chat"] };

/**
 * Resolves a chat session to the tab payload that opens it: bot workspaces
 * get a `bot-chat` tab, everything else a `chat` tab (with a nullable
 * `workspaceId` for ephemeral sessions).
 */
export function openSessionTab(
  session: RecentChatSession,
  workspaces: Pick<Workspace, "id" | "type" | "directory">[],
): SessionTabPayload {
  const dir = session.directory;
  const workspace = workspaces.find((w) => w.directory === dir);
  if (workspace?.type === "bot") {
    return {
      type: "bot-chat",
      data: {
        sessionId: session.id,
        workspaceId: workspace.id,
        directory: dir,
        sessionName: session.title || "New Bot Chat",
      },
    };
  }
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
