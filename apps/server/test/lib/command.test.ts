import { describe, test, expect } from "bun:test";
import { isCommand, parseCommand } from "../../src/lib/command";

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
