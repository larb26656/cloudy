import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createQuickCloudyController } from "./quick-cloudy.controller";
import type { QuickCloudyQuery } from "./quick-cloudy.model";
import type { QuickCloudyService } from "./quick-cloudy.service";

describe("quick-cloudy controller", () => {
  it("returns agent and recent session sections using query options", async () => {
    const getSuggestions = vi.fn(({ limit, search }: QuickCloudyQuery) => ({
      agents: [{ id: "writer", name: "Writer", builtIn: false }],
      recentSessions: [{ id: "session-1", title: search, limit }],
    }));
    const service = { getSuggestions } as unknown as QuickCloudyService;
    const app = new Hono().route(
      "/api/quick-cloudy",
      createQuickCloudyController(service),
    );

    const response = await app.request("/api/quick-cloudy?limit=3&search=note");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      agents: [{ id: "writer", name: "Writer", builtIn: false }],
      recentSessions: [{ id: "session-1", title: "note", limit: 3 }],
    });
    expect(getSuggestions).toHaveBeenCalledWith({ limit: 3, search: "note" });
  });
});
