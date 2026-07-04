import { existsSync } from "node:fs";

export async function checkUiExists(): Promise<boolean> {
  const distPath = "/Users/luckytime1996/Documents/Work/One-man-show/Code/cloudy/apps/web-app/dist";
  return existsSync(distPath);
}

export async function buildAndCopyUi(): Promise<void> {
  console.log("Building and copying UI...");
}
