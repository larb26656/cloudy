import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getBrowserWorkspaceStatus,
  initializeBrowserWorkspace,
} from "../lib/cloudy/browser-workspace";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
});

describe("browser workspace API", () => {
  it("reads the browser workspace status", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ initialized: false }), { status: 200 }),
    );

    await expect(getBrowserWorkspaceStatus()).resolves.toEqual({
      initialized: false,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5122/api/browser-workspace",
      expect.objectContaining({
        credentials: "include",
        method: "GET",
      }),
    );
  });

  it("initializes the browser workspace with POST", async () => {
    const status = {
      initialized: true,
      agent: "browser",
      workspace: {
        id: "browser-workspace",
        directory: "/config/extensions/browser",
      },
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(status), { status: 201 }),
    );

    await expect(initializeBrowserWorkspace()).resolves.toEqual(status);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5122/api/browser-workspace/initialize",
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      }),
    );
  });

  it("surfaces API errors", async () => {
    fetchMock.mockResolvedValue(
      new Response("Cloudy is offline", { status: 503 }),
    );

    await expect(getBrowserWorkspaceStatus()).rejects.toThrow(
      "Cloudy is offline",
    );
  });
});
