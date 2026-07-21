import type { SystemCommandDef } from "./types";
import { newCommand } from "./implementations/new";
import { forkCommand } from "./implementations/fork";
import { sessionCommand } from "./implementations/session";

export const systemCommands: SystemCommandDef[] = [
  newCommand,
  forkCommand,
  sessionCommand,
];

export function findSystemCommand(
  name: string,
): SystemCommandDef | undefined {
  return systemCommands.find((cmd) => cmd.name === name);
}
