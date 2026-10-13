import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { SettingsService } from "./service";
import { SettingsModel } from "./model";

export function createSettingsController(service: SettingsService) {
  return new Hono()
    .get("/providers", (c) => c.json(service.getProviders()))
    .get("/provider-templates", (c) => c.json(service.getProviderTemplates()))
    .post(
      "/providers",
      zValidator("json", SettingsModel.createProviderSchema),
      (c) => c.json(service.createProvider(c.req.valid("json")), 201),
    )
    .patch(
      "/providers/:id",
      zValidator("json", SettingsModel.updateProviderSchema),
      (c) =>
        c.json(service.updateProvider(c.req.param("id"), c.req.valid("json"))),
    )
    .delete("/providers/:id", (c) =>
      c.json(service.deleteProvider(c.req.param("id"))),
    );
}
