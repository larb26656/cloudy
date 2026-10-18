import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { LLMConnectionService } from "./service";
import { LLMConnectionModel } from "./model";

export function createLLMConnectionsController(service: LLMConnectionService) {
  return new Hono()
    .get("/", (c) => c.json(service.getSettings()))
    .post(
      "/connections",
      zValidator("json", LLMConnectionModel.createConnectionSchema),
      (c) => c.json(service.createConnection(c.req.valid("json")), 201),
    )
    .patch(
      "/connections/:id",
      zValidator("json", LLMConnectionModel.updateConnectionSchema),
      (c) =>
        c.json(
          service.updateConnection(c.req.param("id"), c.req.valid("json")),
        ),
    )
    .delete("/connections/:id", (c) =>
      c.json(service.deleteConnection(c.req.param("id"))),
    );
}
