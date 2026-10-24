import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { SettingsModel } from "../settings.model";
import type { AgentProviderSettingsService } from "./settings.agent-providers.service";

export function createAgentProviderSettingsController(
  service: AgentProviderSettingsService,
) {
  return new Hono()
    .get("/agent-providers", (c) => c.json(service.getAgentProviders()))
    .get("/agent-provider-templates", (c) =>
      c.json(service.getAgentProviderTemplates()),
    )
    .post(
      "/agent-providers",
      zValidator("json", SettingsModel.createAgentProviderSchema),
      (c) => c.json(service.createAgentProvider(c.req.valid("json")), 201),
    )
    .patch(
      "/agent-providers/:id",
      zValidator("json", SettingsModel.updateAgentProviderSchema),
      (c) =>
        c.json(
          service.updateAgentProvider(c.req.param("id"), c.req.valid("json")),
        ),
    )
    .delete("/agent-providers/:id", (c) =>
      c.json(service.deleteAgentProvider(c.req.param("id"))),
    );
}
