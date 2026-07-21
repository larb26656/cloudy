import type { SystemCommandDef } from "./types";
import { newCommand } from "./implementations/new";
import { forkCommand } from "./implementations/fork";

export const systemCommands: SystemCommandDef[] = [newCommand, forkCommand];

export function findSystemCommand(
  name: string,
): SystemCommandDef | undefined {
  return systemCommands.find((cmd) => cmd.name === name);
}
