import { useCallback } from "react";
import type { SystemCommandHandler } from "../../types";

export function useSessionHandler(): SystemCommandHandler {
  return useCallback((_args, ctx) => {
    ctx.openSessionPicker?.();
  }, []);
}
