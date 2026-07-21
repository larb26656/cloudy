import type { SystemCommandDef } from "../../types";
import { useForkHandler } from "./useForkHandler";

export const forkCommand: SystemCommandDef = {
  name: "fork",
  description: "Fork current session",
  useHandler: useForkHandler,
};
