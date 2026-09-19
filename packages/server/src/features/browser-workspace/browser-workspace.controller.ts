import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import type { BrowserWorkspaceService } from "./browser-workspace.service";

export function createBrowserWorkspaceController(
  service: BrowserWorkspaceService,
) {
  return new Hono()
    .get(
      "/",
      describeRoute({
        description: "Get browser workspace initialization status",
        tags: ["Browser workspace"],
        responses: { 200: { description: "Browser workspace status" } },
      }),
      (c) => c.json(service.getStatus()),
    )
    .post(
      "/initialize",
      describeRoute({
        description: "Initialize the browser workspace",
        tags: ["Browser workspace"],
        responses: {
          200: { description: "Browser workspace already initialized" },
          201: { description: "Browser workspace initialized" },
          409: { description: "Browser workspace directory is already in use" },
        },
      }),
      async (c) => {
        const { status, created } = await service.initialize();
        return c.json(status, created ? 201 : 200);
      },
    );
}
