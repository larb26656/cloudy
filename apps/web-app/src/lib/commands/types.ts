import type { ModelConfig } from "@/types";

export interface SystemCommandContext {
  directory: string;
  sessionId: string | null;
  onSessionChange?: (id: string | null) => void;
  openSessionPicker?: () => void;
  model?: ModelConfig | null;
  agent?: string | null;
}

export type SystemCommandHandler = (
  args: string,
  ctx: SystemCommandContext,
) => Promise<void> | void;

export interface SystemCommandDef {
  name: string;
  description: string;
  immediate?: boolean;
  useHandler: () => SystemCommandHandler;
}
