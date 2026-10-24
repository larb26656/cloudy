import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { SettingsModel } from "../settings.model";
import type { AgentsService } from "./settings.agents.service";

export function createAgentsController(service: AgentsService) {
  return new Hono()
    .get("/agents", (c) => c.json(service.getAgents()))
    .post("/agents", zValidator("json", SettingsModel.createAgentSchema), (c) =>
      c.json(service.createAgent(c.req.valid("json")), 201),
    )
    .patch(
      "/agents/:id",
      zValidator("json", SettingsModel.updateAgentSchema),
      (c) =>
        c.json(service.updateAgent(c.req.param("id"), c.req.valid("json"))),
    )
    .delete("/agents/:id", (c) =>
      c.json(service.deleteAgent(c.req.param("id"))),
    );
}
