import type { Plugin } from "@opencode-ai/plugin";
import { list, create, update, remove } from "../tools";
import { isDestructiveBashOnIdea, isIdeaIndexMd, isFileIdeaFile, extractIdeaPath, IDEA_DIR } from "./idea-plugins";
import { touchIdea } from "../lib/api";

export const IdeaPlugin: Plugin = async ({
  project,
  client,
  $,
  directory,
  worktree,
}) => {
  return {
    tool: {
      idea_list: list,
      idea_create: create,
      idea_update: update,
      idea_remove: remove,
    },
    "tool.execute.before": async (input, output): Promise<void> => {
      if (input.tool === "bash") {
        const command = (output.args.command as string) ?? "";

        if (isDestructiveBashOnIdea(command, IDEA_DIR())) {
          throw new Error(`Cannot run destructive command on idea directory`);
        }
      }

      if (input.tool === "write") {
        const filePath = output.args.filePath as string;

        if (isFileIdeaFile(filePath)) {
          const ideaPath = extractIdeaPath(filePath);
          await touchIdea(ideaPath);
        }
      }

      if (input.tool === "edit") {
        const filePath = output.args.filePath as string;

        if (isFileIdeaFile(filePath)) {
          const ideaPath = extractIdeaPath(filePath);
          await touchIdea(ideaPath);
        }
      }
    },
  };
};
