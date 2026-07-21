import type { SystemCommandDef } from "../../types";
import { useNewHandler } from "./useNewHandler";

export const newCommand: SystemCommandDef = {
  name: "new",
  description: "Create a new session",
  immediate: true,
  useHandler: useNewHandler,
};
