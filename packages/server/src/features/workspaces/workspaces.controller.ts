import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { WorkspacesModel } from "./workspaces.model";
import type { WorkspacesService } from "./workspaces.service";

const idParamSchema = z.object({ id: z.string().min(1) });

/**
 * REST surface for workspaces. CRUD over `/api/workspaces`. The service throws
 * `DomainError` subclasses that the error middleware maps to HTTP status codes,
 * so route handlers stay thin — just validate, delegate, shape the response.
 */
export function createWorkspacesController(service: WorkspacesService) {
  return new Hono()
    .get(
      "/",
      describeRoute({
        description: "List all workspaces",
        tags: ["Workspaces"],
        responses: { 200: { description: "Workspace list" } },
      }),
      (c) => c.json(service.list()),
    )
    .post(
      "/",
      describeRoute({
        description: "Create a workspace",
        tags: ["Workspaces"],
        responses: {
          201: { description: "Workspace created" },
          400: { description: "Invalid input" },
          409: { description: "Directory already in use" },
        },
      }),
      zValidator("json", WorkspacesModel.createWorkspaceSchema),
      (c) => {
        const input = c.req.valid("json");
        const created = service.create(input);
        return c.json(created, 201);
      },
    )
    .get(
      "/:id",
      describeRoute({
        description: "Get a workspace by id",
        tags: ["Workspaces"],
        responses: {
          200: { description: "Workspace" },
          404: { description: "Workspace not found" },
        },
      }),
      zValidator("param", idParamSchema),
      (c) => {
        const { id } = c.req.valid("param");
        return c.json(service.get(id));
      },
    )
    .patch(
      "/:id",
      describeRoute({
        description: "Update a workspace",
        tags: ["Workspaces"],
        responses: {
          200: { description: "Workspace updated" },
          404: { description: "Workspace not found" },
          409: { description: "Directory already in use" },
        },
      }),
      zValidator("param", idParamSchema),
      zValidator("json", WorkspacesModel.updateWorkspaceSchema),
      (c) => {
        const { id } = c.req.valid("param");
        const input = c.req.valid("json");
        return c.json(service.update(id, input));
      },
    )
    .delete(
      "/:id",
      describeRoute({
        description: "Delete a workspace",
        tags: ["Workspaces"],
        responses: {
          204: { description: "Workspace deleted" },
          404: { description: "Workspace not found" },
        },
      }),
      zValidator("param", idParamSchema),
      (c) => {
        const { id } = c.req.valid("param");
        service.delete(id);
        return c.body(null, 204);
      },
    );
}
