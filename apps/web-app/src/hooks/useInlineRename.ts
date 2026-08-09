import { useCallback, useState } from "react";
import { useUpdateSession } from "@/hooks/queries/useSessions";

export interface UseInlineRenameOptions {
  sessionId: string;
  directory?: string;
  initialTitle: string;
}

export interface UseInlineRenameResult {
  isEditing: boolean;
  value: string;
  isPending: boolean;
  start: () => void;
  commit: () => void;
  cancel: () => void;
  setValue: (value: string) => void;
}

export function useInlineRename({
  sessionId,
  directory,
  initialTitle,
}: UseInlineRenameOptions): UseInlineRenameResult {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialTitle);
  const updateSession = useUpdateSession();

  const start = useCallback(() => {
    setValue(initialTitle);
    setIsEditing(true);
  }, [initialTitle]);

  const commit = useCallback(() => {
    const trimmed = value.trim();
    setIsEditing(false);
    if (!trimmed || trimmed === initialTitle) return;
    updateSession.mutate({ sessionID: sessionId, directory, title: trimmed });
  }, [value, initialTitle, updateSession, sessionId, directory]);

  const cancel = useCallback(() => {
    setValue(initialTitle);
    setIsEditing(false);
  }, [initialTitle]);

  return {
    isEditing,
    value,
    isPending: updateSession.isPending,
    start,
    commit,
    cancel,
    setValue,
  };
}
