import { create } from "zustand";
import { getErrorMessage } from "@/lib/opencode";
import type { SdkError } from "@/lib/opencode";
import { systemCommands } from "@/lib/command";
import type { OpencodeClient } from "@opencode-ai/sdk/v2";

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
};

export type CommandSuggestionStoreState = {
  commands: Command[];
  isLoading: boolean;
  error: string | null;
};

export type CommandSuggestionStoreActions = {
  loadCommands: () => Promise<Command[]>;
  getFilteredCommands: (query: string) => Command[];
};

export type CommandSuggestionStore = CommandSuggestionStoreState & CommandSuggestionStoreActions;

export const createCommandSuggestionStore = (oc: OpencodeClient) => create<CommandSuggestionStore>()((set, get) => ({
  commands: [],
  isLoading: false,
  error: null,

  loadCommands: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await oc.command.list();

      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }

      const openCodeCommands = result.data ?? [];
      const systemCommandItems: Command[] = systemCommands.map((cmd) => ({
        name: cmd.name,
        description: cmd.description,
        source: "system" as CommandSource,
        template: "",
        hints: [],
      }));

      const commands = [...systemCommandItems, ...openCodeCommands];
      set({ commands, isLoading: false });
      return commands;
    } catch (err) {
      const message = (err as Error).message;
      set({ error: message, isLoading: false, commands: [] });
      return [];
    }
  },

  getFilteredCommands: (query: string) => {
    const { commands } = get();
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(lowerQuery) ||
        cmd.description?.toLowerCase().includes(lowerQuery) ||
        cmd.hints.some((hint) => hint.toLowerCase().includes(lowerQuery))
    );
  },
}));
