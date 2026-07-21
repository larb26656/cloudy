import type { SystemCommandDef } from "../../types";
import { useSessionHandler } from "./useSessionHandler";

export const sessionCommand: SystemCommandDef = {
  name: "session",
  description: "Switch to another session",
  immediate: true,
  useHandler: useSessionHandler,
};
