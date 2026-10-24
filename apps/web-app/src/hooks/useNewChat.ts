import { useCallback } from "react";
import { useCreateTempWorkspace } from "@/hooks/queries/useWorkspaces";
import { useRecentDirectoryStore } from "@/stores/recentDirectoryStore";
import { useTabStore } from "@/stores/tabStore";

type NewChatOptions = {
  providerId: string;
  directory: string;
  sessionId?: string | null;
  workspaceId?: string | null;
  sessionName?: string;
  agent?: string | null;
};

type CreateTempChatOptions = Pick<NewChatOptions, "providerId" | "agent"> & {
  onCreated?: (chat: {
    providerId: string;
    agent?: string | null;
    directory: string;
    sessionName: string;
  }) => void;
};

export function useNewChat() {
  const addTab = useTabStore((state) => state.addTab);
  const pushRecentDirectory = useRecentDirectoryStore((state) => state.push);
  const { mutate: mutateCreateTempWorkspace, isPending: isCreatingTemp } =
    useCreateTempWorkspace();

  const create = useCallback(
    ({
      providerId,
      directory,
      sessionId,
      workspaceId = null,
      sessionName = "New Chat",
      agent,
    }: NewChatOptions) =>
      addTab("chat", {
        providerId,
        sessionId: sessionId ?? null,
        workspaceId,
        directory,
        sessionName,
        agent,
      }),
    [addTab],
  );

  const createTemp = useCallback(
    ({ providerId, agent, onCreated }: CreateTempChatOptions) =>
      mutateCreateTempWorkspace(undefined, {
        onSuccess: ({ name, directory }) => {
          pushRecentDirectory(directory);
          if (onCreated) {
            onCreated({ providerId, agent, directory, sessionName: name });
          } else {
            create({ providerId, agent, directory, sessionName: name });
          }
        },
      }),
    [create, mutateCreateTempWorkspace, pushRecentDirectory],
  );

  return {
    create,
    createTemp,
    isCreatingTemp,
  };
}
