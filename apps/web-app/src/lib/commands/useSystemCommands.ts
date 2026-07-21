import { useMemo } from "react";
import type { SystemCommandContext, SystemCommandHandler } from "./types";
import { systemCommands } from "./registry";

export function useSystemCommands() {
  const handlers: SystemCommandHandler[] = systemCommands.map((cmd) =>
    cmd.useHandler(),
  );

  return useMemo(
    () => ({
      commands: systemCommands,
      execute: (name: string, args: string, ctx: SystemCommandContext) => {
        const idx = systemCommands.findIndex((cmd) => cmd.name === name);
        if (idx >= 0) {
          return handlers[idx](args, ctx);
        }
      },
    }),
    [handlers],
  );
}
