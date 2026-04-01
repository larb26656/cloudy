import path from "node:path";
import type { Plugin } from "@opencode-ai/plugin";
import { touchIdea } from "../lib/api";

const WORKSPACE_PATH =
    "/Users/luckytime1996/Documents/Work/One-man-show/Code/opencode-chat/apps/server/base-path";

const IDEA_DIR = path.join(WORKSPACE_PATH, "idea");

const DESTRUCTIVE_COMMANDS = ["rm", "mv", "cp", "rmdir", "chmod", "chown", "ln"];

export function isDestructiveBashOnIdea(command: string, ideaDir: string): boolean {
    const tokens = command.trim().split(/\s+/);
    const cmd = tokens[0];

    if (!DESTRUCTIVE_COMMANDS.includes(cmd)) return false;

    const normalizedIdeaDir = path.resolve(ideaDir);

    return tokens.slice(1).some((t) => {
        const resolved = path.resolve(t);
        return resolved.startsWith(normalizedIdeaDir + path.sep) || resolved === normalizedIdeaDir;
    });
}

export function isFileIdeaFile(filePath: string, ideaDir: string = IDEA_DIR): boolean {
    const normalizedIdeaPath = path.resolve(ideaDir);
    const normalizedFile = path.resolve(filePath);

    return normalizedFile.startsWith(normalizedIdeaPath + path.sep);
}

export function isIdeaIndexMd(filePath: string, ideaDir: string = IDEA_DIR): boolean {
    if (!isFileIdeaFile(filePath, ideaDir)) return false;
    return path.basename(filePath) === "index.md";
}

export function extractIdeaPath(filePath: string, ideaDir: string = IDEA_DIR): string {
    const normalizedIdeaPath = path.resolve(ideaDir);
    const normalizedFile = path.resolve(filePath);
    const relative = normalizedFile.slice(normalizedIdeaPath.length + 1);

    return relative.split(path.sep)[0] ?? "";
}

export const IdeaPlugin: Plugin = async ({
    project,
    client,
    $,
    directory,
    worktree,
}) => {
    return {
        "tool.execute.before": async (input, output): Promise<void> => {
            if (input.tool === "bash") {
                const command = (output.args.command as string) ?? "";

                if (isDestructiveBashOnIdea(command, IDEA_DIR)) {
                    throw new Error(`Cannot run destructive command on idea directory`);
                }
            }

            if (input.tool === "write") {
                const filePath = output.args.filePath as string;

                if (isIdeaIndexMd(filePath)) {
                    throw new Error("Cannot overwrite index.md in idea directory");
                }

                if (isFileIdeaFile(filePath)) {
                    const ideaPath = extractIdeaPath(filePath);
                    await touchIdea(ideaPath);
                }
            }

            if (input.tool === "edit") {
                const filePath = output.args.filePath as string;

                if (isIdeaIndexMd(filePath)) {
                    throw new Error("Cannot modify index.md in idea directory");
                }

                if (isFileIdeaFile(filePath)) {
                    const ideaPath = extractIdeaPath(filePath);
                    await touchIdea(ideaPath);
                }
            }
        },
    };
};