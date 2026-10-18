import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { LLMProvidersService } from "./service";
import { LLMProvidersModel } from "./model";

export function createLLMProvidersController(service: LLMProvidersService) {
  return new Hono()
    .get("/", (c) => c.json(service.getSettings()))
    .post(
      "/connections",
      zValidator("json", LLMProvidersModel.createConnectionSchema),
      (c) => c.json(service.createConnection(c.req.valid("json")), 201),
    )
    .patch(
      "/connections/:id",
      zValidator("json", LLMProvidersModel.updateConnectionSchema),
      (c) =>
        c.json(
          service.updateConnection(c.req.param("id"), c.req.valid("json")),
        ),
    )
    .delete("/connections/:id", (c) =>
      c.json(service.deleteConnection(c.req.param("id"))),
    )
    .put("/default", zValidator("json", LLMProvidersModel.defaultSchema), (c) =>
      c.json(service.setDefault(c.req.valid("json"))),
    );
}
