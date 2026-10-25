import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AutomationsService } from "./automations.service";
import { AutomationsModel } from "./automations.model";
import { nextCronOccurrences } from "./automations.scheduler";

export function createAutomationsController(service: AutomationsService) {
  return new Hono()
    .get("/", (c) => c.json(service.list()))
    .post(
      "/",
      zValidator("json", AutomationsModel.automationCreateSchema),
      async (c) => c.json(await service.create(c.req.valid("json")), 201),
    )
    .get(
      "/:id",
      zValidator("param", AutomationsModel.automationIdSchema),
      (c) => c.json(service.get(c.req.valid("param").id)),
    )
    .patch(
      "/:id",
      zValidator("param", AutomationsModel.automationIdSchema),
      zValidator("json", AutomationsModel.automationUpdateSchema),
      async (c) =>
        c.json(
          await service.update(c.req.valid("param").id, c.req.valid("json")),
        ),
    )
    .delete(
      "/:id",
      zValidator("param", AutomationsModel.automationIdSchema),
      (c) => {
        service.delete(c.req.valid("param").id);
        return c.body(null, 204);
      },
    )
    .get(
      "/:id/runs",
      zValidator("param", AutomationsModel.automationIdSchema),
      (c) => c.json(service.listRuns(c.req.valid("param").id)),
    )
    .get(
      "/:id/schedule/preview",
      zValidator("param", AutomationsModel.automationIdSchema),
      (c) => {
        const automation = service.get(c.req.valid("param").id);
        if (!automation.schedule) return c.json({ occurrences: [] });
        return c.json({
          occurrences: nextCronOccurrences(
            automation.schedule.cron,
            automation.schedule.timezone,
            new Date(),
          ).map((date) => date.toISOString()),
        });
      },
    )
    .get(
      "/:id/runs/:runId",
      zValidator("param", AutomationsModel.runParamSchema),
      (c) =>
        c.json(
          service.getRun(c.req.valid("param").id, c.req.valid("param").runId),
        ),
    )
    .post(
      "/:id/runs",
      zValidator("param", AutomationsModel.automationIdSchema),
      async (c) => c.json(await service.start(c.req.valid("param").id), 202),
    )
    .post(
      "/:id/runs/:runId/stop",
      zValidator("param", AutomationsModel.runParamSchema),
      async (c) =>
        c.json(
          await service.stop(
            c.req.valid("param").id,
            c.req.valid("param").runId,
          ),
        ),
    );
}
