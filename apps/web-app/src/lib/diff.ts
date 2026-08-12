export function normalizeDiff(diff: string): string {
  const lines = diff.split("\n");

  if (
    lines[0]?.startsWith("Index: ") &&
    /^=+$/.test(lines[1]?.trim() ?? "")
  ) {
    return lines.slice(2).join("\n");
  }

  return diff;
}
