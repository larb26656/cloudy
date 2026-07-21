import { useCallback } from "react";
import type { SystemCommandHandler } from "../../types";

export function useNewHandler(): SystemCommandHandler {
  return useCallback((_args, ctx) => {
    ctx.onSessionChange?.(null);
  }, []);
}
