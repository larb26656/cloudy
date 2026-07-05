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
  immediate?: boolean;
}

export type CommandSource = "command" | "mcp" | "skill" | "system";

export type Command = {
  name: string;
  description?: string;
  agent?: string;
  model?: string;
  source?: CommandSource;
  template: string;
  subtask?: boolean;
  hints: Array<string>;
  immediate?: boolean;
};

export const systemCommands: SystemCommand[] = [
  {
    name: "new",
    description: "Create a new session",
    immediate: true,
  },
  {
    name: "fork",
    description: "Fork current session",
  },
];

export const mockCommands: Command[] = systemCommands.map((cmd) => ({
  name: cmd.name,
  description: cmd.description,
  source: "system",
  template: "",
  hints: [],
  immediate: cmd.immediate,
}));

export function findSystemCommand(name: string): SystemCommand | undefined {
  return systemCommands.find((cmd) => cmd.name === name);
}
