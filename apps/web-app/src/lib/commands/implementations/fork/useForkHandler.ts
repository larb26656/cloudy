import { useCallback } from "react";
import { useForkSession } from "@/hooks/queries/useSessions";
import type { SystemCommandHandler } from "../../types";

export function useForkHandler(): SystemCommandHandler {
  const forkSession = useForkSession();

  return useCallback(
    (_args, ctx) => {
      if (!ctx.sessionId) return;
      forkSession.mutate(
        {
          sessionID: ctx.sessionId,
          directory: ctx.directory,
        },
        {
          onSuccess: (forkedSession) => {
            ctx.onSessionChange?.(forkedSession.id);
          },
        },
      );
    },
    [forkSession],
  );
}
