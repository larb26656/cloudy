import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { startOAuthLogin } from "./chatgpt-plan.oauth-login";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(
    (
      _command: string,
      _args: string[],
      callback: (error: Error | null) => void,
    ) => callback(null),
  ),
}));

vi.mock("../../../lib/siwc/credentials", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../lib/siwc/credentials")>();
  return {
    ...actual,
    readCredentials: vi.fn().mockRejectedValue(new Error("No credentials")),
  };
});

describe("ChatGPT OAuth login", () => {
  it("creates a host ID, starts a local callback server, and returns a started URL", async () => {
    const configDir = await mkdtemp(path.join(tmpdir(), "cloudy-oauth-login-"));
    let callbackServer: Server | undefined;
    let pendingTimeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const result = await startOAuthLogin({
        configDir,
        credentialsPath: path.join(configDir, "credentials.json"),
        activate: vi.fn(),
        finishPending: vi.fn(),
        setCallbackServer: (server) => {
          callbackServer = server;
        },
        setPendingTimeout: (timeout) => {
          pendingTimeout = timeout;
        },
      });

      expect(result).toEqual({ started: true });
      expect(callbackServer?.listening).toBe(true);
      const hostId = await readFile(
        path.join(configDir, "chatgpt-plan-host-id"),
        "utf8",
      );
      expect(hostId).toMatch(/^urn:uuid:/);
      expect(pendingTimeout).toBeDefined();
    } finally {
      if (pendingTimeout) clearTimeout(pendingTimeout);
      if (callbackServer?.listening)
        await new Promise<void>((resolve) =>
          callbackServer?.close(() => resolve()),
        );
      await rm(configDir, { recursive: true, force: true });
    }
  });
});
