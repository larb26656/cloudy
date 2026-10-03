import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { SettingsService } from "./service";
import { SettingsModel } from "./model";

export function createSettingsController(service: SettingsService) {
  return new Hono()
    .get("/providers", (c) => c.json(service.getProviders()))
    .patch(
      "/providers",
      zValidator("json", SettingsModel.providersSchema),
      (c) => c.json(service.updateProviders(c.req.valid("json"))),
    );
}
