import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { QuickCloudyModel } from "./quick-cloudy.model";
import type { QuickCloudyService } from "./quick-cloudy.service";

export function createQuickCloudyController(service: QuickCloudyService) {
  return new Hono().get(
    "/",
    zValidator("query", QuickCloudyModel.quickCloudyQuerySchema),
    (c) => c.json(service.getSuggestions(c.req.valid("query"))),
  );
}
