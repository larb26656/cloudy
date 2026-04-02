import path from "node:path";
import { env } from "../lib/env";

function getIdeaDir() {
  return path.resolve(env.CLOUDY_ASSISTANT_BASE_PATH, "idea");
}

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

export function isFileIdeaFile(filePath: string, ideaDir: string = getIdeaDir()): boolean {
  const normalizedIdeaPath = path.resolve(ideaDir);
  const normalizedFile = path.resolve(filePath);

  return normalizedFile.startsWith(normalizedIdeaPath + path.sep);
}

export function isIdeaIndexMd(filePath: string, ideaDir: string = getIdeaDir()): boolean {
  if (!isFileIdeaFile(filePath, ideaDir)) return false;
  return path.basename(filePath) === "index.md";
}

export function extractIdeaPath(filePath: string, ideaDir: string = getIdeaDir()): string {
  const normalizedIdeaPath = path.resolve(ideaDir);
  const normalizedFile = path.resolve(filePath);
  const relative = normalizedFile.slice(normalizedIdeaPath.length + 1);

  return relative.split(path.sep)[0] ?? "";
}

export { getIdeaDir as IDEA_DIR };
