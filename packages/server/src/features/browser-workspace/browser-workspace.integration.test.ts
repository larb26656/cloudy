import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "../../test-utils";

type TestEnv = ReturnType<typeof createTestApp>;

let env: TestEnv;
let tempDirectory: string;

beforeEach(async () => {
  tempDirectory = await mkdtemp(path.join(os.tmpdir(), "cloudy-browser-"));
  env = createTestApp({ extensionWorkspaceDir: tempDirectory });
});

afterEach(async () => {
  env.close();
  await rm(tempDirectory, { recursive: true, force: true });
});

describe("browser workspace integration", () => {
  it("reports uninitialized before setup", async () => {
    const response = await env.app.request("/api/browser-workspace");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ initialized: false });
  });

  it("initializes a normal agent workspace and returns 201", async () => {
    const response = await env.app.request(
      "/api/browser-workspace/initialize",
      {
        method: "POST",
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      initialized: true,
      agent: "browser",
      workspace: {
        id: "browser-workspace",
        type: "agent",
        directory: path.join(tempDirectory, "browser"),
      },
    });
    await expect(
      readFile(path.join(tempDirectory, "browser", "AGENTS.md"), "utf8"),
    ).resolves.toContain("Browser Side-Panel Assistant");
    await expect(
      readFile(path.join(tempDirectory, "browser", "opencode.json"), "utf8"),
    ).resolves.toContain('"browser"');
  });

  it("returns the existing workspace with 200 without overwriting templates", async () => {
    await env.app.request("/api/browser-workspace/initialize", {
      method: "POST",
    });
    const agentsFile = path.join(tempDirectory, "browser", "AGENTS.md");
    await writeFile(agentsFile, "custom agents", "utf8");

    const response = await env.app.request(
      "/api/browser-workspace/initialize",
      {
        method: "POST",
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      initialized: true,
      workspace: { id: "browser-workspace" },
    });
    await expect(readFile(agentsFile, "utf8")).resolves.toBe("custom agents");
  });

  it("returns 409 when another workspace owns the reserved directory", async () => {
    const directory = path.join(tempDirectory, "browser");
    await env.app.request("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "other-workspace",
        name: "Other",
        color: "#000000",
        type: "agent",
        directory,
      }),
    });

    const response = await env.app.request(
      "/api/browser-workspace/initialize",
      {
        method: "POST",
      },
    );

    expect(response.status).toBe(409);
  });
});
