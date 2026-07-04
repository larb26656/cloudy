import { describe, test, expect } from "vitest";
import { isCommand, parseCommand, shouldShowSlashCommand } from "./command";

describe("isCommand", () => {
  test("returns true for string starting with /", () => {
    expect(isCommand("/review")).toBe(true);
    expect(isCommand("/hello world")).toBe(true);
  });

  test("returns false for string not starting with /", () => {
    expect(isCommand("hello")).toBe(false);
    expect(isCommand("hello /world")).toBe(false);
    expect(isCommand("")).toBe(false);
  });
});

describe("parseCommand", () => {
  test("parses command without arguments", () => {
    const result = parseCommand("/review");
    expect(result).toEqual({ command: "review", arguments: "" });
  });

  test("parses command with arguments", () => {
    const result = parseCommand("/review arg1 arg2");
    expect(result).toEqual({ command: "review", arguments: "arg1 arg2" });
  });

  test("parses command with multiple arguments", () => {
    const result = parseCommand("/cmd foo bar baz");
    expect(result).toEqual({ command: "cmd", arguments: "foo bar baz" });
  });

  test("returns null for non-command string", () => {
    expect(parseCommand("hello")).toBeNull();
    expect(parseCommand("hello world")).toBeNull();
  });

  test("handles empty string", () => {
    expect(parseCommand("")).toBeNull();
  });

  test("handles command with only slash", () => {
    expect(parseCommand("/")).toEqual({ command: "", arguments: "" });
  });
});

describe("shouldShowSlashCommand", () => {
  test("returns true when at start of line with no text", () => {
    const result = shouldShowSlashCommand({
      state: { doc: { textBetween: () => "" } },
      range: { from: 0, to: 0 },
    });
    expect(result).toBe(true);
  });

  test("returns true when only whitespace before cursor", () => {
    const result = shouldShowSlashCommand({
      state: { doc: { textBetween: () => "   " } },
      range: { from: 3, to: 3 },
    });
    expect(result).toBe(true);
  });

  test("returns true when only newlines before cursor", () => {
    const result = shouldShowSlashCommand({
      state: { doc: { textBetween: () => "\n\n" } },
      range: { from: 2, to: 2 },
    });
    expect(result).toBe(true);
  });

  test("returns false when text exists before cursor", () => {
    const result = shouldShowSlashCommand({
      state: { doc: { textBetween: () => "Hello world" } },
      range: { from: 11, to: 11 },
    });
    expect(result).toBe(false);
  });

  test("returns false when backslash exists before cursor", () => {
    const result = shouldShowSlashCommand({
      state: { doc: { textBetween: () => "\\" } },
      range: { from: 1, to: 1 },
    });
    expect(result).toBe(false);
  });

  test("returns false when backslash exists after whitespace", () => {
    const result = shouldShowSlashCommand({
      state: { doc: { textBetween: () => "   \\" } },
      range: { from: 4, to: 4 },
    });
    expect(result).toBe(false);
  });

  test("returns false when text with backslash before cursor", () => {
    const result = shouldShowSlashCommand({
      state: { doc: { textBetween: () => "Hello \\" } },
      range: { from: 7, to: 7 },
    });
    expect(result).toBe(false);
  });

  test("returns true when at start with mixed whitespace and newlines", () => {
    const result = shouldShowSlashCommand({
      state: { doc: { textBetween: () => "  \n  " } },
      range: { from: 4, to: 4 },
    });
    expect(result).toBe(true);
  });

  test("returns false when only backslash at start", () => {
    const result = shouldShowSlashCommand({
      state: { doc: { textBetween: () => "\\" } },
      range: { from: 1, to: 1 },
    });
    expect(result).toBe(false);
  });
});
