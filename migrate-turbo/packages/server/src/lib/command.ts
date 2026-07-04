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
