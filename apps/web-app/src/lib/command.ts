import { getStore } from "@/stores/instance";
import { oc } from "./opencode";
import type { ChatInputContent } from "./opencode";
import type { ModelConfig } from "@/types";

export interface SlashCommandState {
  state: {
    doc: { textBetween: (from: number, to: number, sep?: string, block?: string) => string };
  };
  range: { from: number; to: number };
}

export function shouldShowSlashCommand({ state, range }: SlashCommandState): boolean {
  const textBefore = state.doc.textBetween(0, range.from, " ", "\n");
  const trimmed = textBefore.trim();
  const hasBackslash = trimmed.includes("\\");

  return trimmed === "" && !hasBackslash;
}

export interface ParsedCommand {
  command: string;
  arguments: string;
}

export function isCommand(input: string): boolean {
  return input.startsWith("/");
}

export function parseCommand(input: string): ParsedCommand | null {
  if (!isCommand(input)) {
    return null;
  }

  const withoutSlash = input.slice(1);
  const spaceIndex = withoutSlash.indexOf(" ");

  if (spaceIndex === -1) {
    return { command: withoutSlash, arguments: "" };
  }

  return {
    command: withoutSlash.slice(0, spaceIndex),
    arguments: withoutSlash.slice(spaceIndex + 1),
  };
}

export interface SendMessageParams {
  directory: string;
  sessionId: string;
  content: ChatInputContent;
  model?: ModelConfig | null;
  agent?: string | null;
}

export interface SystemCommand {
  name: string;
  description: string;
  execute: (args: string) => Promise<void> | void;
}

export const systemCommands: SystemCommand[] = [
  {
    name: "new",
    description: "Create a new session",
    execute: async () => {
      getStore("session").getState().createTempSession();
    },
  },
];

export function findSystemCommand(name: string): SystemCommand | undefined {
  return systemCommands.find((cmd) => cmd.name === name);
}

export async function executeOCCommand(params: {
  directory: string;
  sessionId: string;
  command: string;
  arguments: string;
  model?: ModelConfig | null;
  agent?: string | null;
}): Promise<void> {
  const { directory, sessionId, command, arguments: args, model, agent } = params;

  const systemCommand = findSystemCommand(command);
  if (systemCommand) {
    await systemCommand.execute(args);
    return;
  }

  const sendModel = model ? `${model.providerID}/${model.modelID}` : undefined;

  await oc.session.command({
    sessionID: sessionId,
    command,
    arguments: args,
    model: sendModel,
    agent: agent ?? undefined,
  }, {
    headers: { 'x-opencode-directory': directory }
  });
}
