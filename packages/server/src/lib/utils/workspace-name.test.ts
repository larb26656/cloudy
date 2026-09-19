import { describe, it, expect } from "vitest";
import {
  randomWorkspaceName,
  workspaceAdjectives,
  workspaceNouns,
} from "./workspace-name";

const namePattern = new RegExp(
  `^(?:${workspaceAdjectives.join("|")})-(?:${workspaceNouns.join("|")})-[a-z0-9]+$`,
);

describe("randomWorkspaceName", () => {
  it("should produce adjective-noun-timestamp in lowercase kebab-case", () => {
    for (let i = 0; i < 50; i++) {
      expect(randomWorkspaceName()).toMatch(namePattern);
    }
  });

  it("should embed the base-36 timestamp of the given date", () => {
    const now = new Date("2024-01-01T00:00:00.000Z");
    const name = randomWorkspaceName(now);
    expect(name.endsWith(`-${now.getTime().toString(36)}`)).toBe(true);
  });

  it("should generate unique names for distinct timestamps", () => {
    const base = new Date("2024-01-01T00:00:00.000Z").getTime();
    const names = new Set(
      Array.from({ length: 100 }, (_, i) =>
        randomWorkspaceName(new Date(base + i)),
      ),
    );
    expect(names.size).toBe(100);
  });

  it("should draw from both word pools across many calls", () => {
    const names = Array.from({ length: 200 }, () => randomWorkspaceName());
    const adjectives = new Set(names.map((n) => n.split("-")[0]));
    const nouns = new Set(names.map((n) => n.split("-")[1]));
    expect(adjectives.size).toBeGreaterThan(1);
    expect(nouns.size).toBeGreaterThan(1);
  });
});
