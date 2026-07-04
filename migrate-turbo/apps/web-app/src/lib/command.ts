import { getOC, getStore } from "@/hooks/instanceScopeHook";
import type { ChatInputContent } from "./opencode";
import type { ModelConfig } from "@/types";
import { toast } from "sonner";

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
  immediate?: boolean;
  execute: (args: string, instanceId: string) => Promise<void> | void;
}

export const systemCommands: SystemCommand[] = [
  {
    name: "new",
    description: "Create a new session",
    immediate: true,
    execute: async (_args, instanceId) => {
      getStore("session", instanceId).getState().createTempSession();
    },
  },
  {
    name: "fork",
    description: "Fork current session",
    execute: async (_args, instanceId) => {
      const sessionStore = getStore("session", instanceId).getState();
      const selectedSessionId = sessionStore.selectedSessionId;
      if (!selectedSessionId) return;

      const oc = getOC(instanceId);
      const result = await oc.session.messages({ sessionID: selectedSessionId });
      if (result.error) {
        toast.error("Failed to load messages for fork");
        return;
      }
      if (!result.data?.length) {
        toast.error("No messages found to fork");
        return;
      }

      const lastMessage = result.data[result.data.length - 1];
      const forkResult = await sessionStore.forkSession(selectedSessionId, lastMessage.info.id);

      if (!forkResult.success) {
        toast.error(forkResult.error ?? "Failed to fork session");
      }
    },
  },
];

export function findSystemCommand(name: string): SystemCommand | undefined {
  return systemCommands.find((cmd) => cmd.name === name);
}

export async function executeSystemCommand(params: {
  arguments: string;
  command: string;
  instanceId: string;
}): Promise<boolean> {
  const { command, arguments: args, instanceId } = params;

  const systemCommand = findSystemCommand(command);
  if (systemCommand) {
    await systemCommand.execute(args, instanceId);
    return true;
  }

  return false;
}

export async function executeOCCommand(params: {
  directory: string;
  sessionId: string;
  command: string;
  arguments: string;
  model?: ModelConfig | null;
  agent?: string | null;
  instanceId: string;
}): Promise<void> {
  const { directory, sessionId, command, arguments: args, model, agent, instanceId } = params;

  const isExceSystemCommand = await executeSystemCommand({
    command,
    arguments: args,
    instanceId
  });

  if (isExceSystemCommand) {
    return;
  }

  const sendModel = model ? `${model.providerID}/${model.modelID}` : undefined;

  await getOC(instanceId).session.command({
    sessionID: sessionId,
    command,
    arguments: args,
    model: sendModel,
    agent: agent ?? undefined,
  }, {
    headers: { 'x-opencode-directory': directory }
  });
}
