import path from "node:path";

const WORKSPACE_PATH =
  "/Users/luckytime1996/Documents/Work/One-man-show/Code/opencode-chat/apps/server/base-path";

const IDEA_DIR = path.join(WORKSPACE_PATH, "idea");

const DESTRUCTIVE_COMMANDS = ["rm", "mv", "cp", "rmdir", "chmod", "chown", "ln"];

export function isDestructiveBashOnIdea(command: string, ideaDir: string): boolean {
  const tokens = command.trim().split(/\s+/);
  const cmd = tokens[0];

  if (!DESTRUCTIVE_COMMANDS.includes(cmd ?? '')) return false;

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

export { IDEA_DIR };
