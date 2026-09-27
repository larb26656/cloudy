import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { describeRoute } from "hono-openapi";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createProviderEventHub, type ProviderRegistry } from "../../providers";
import { ProvidersModel } from "./providers.model";
import type { SessionsService } from "../sessions";

const providerParamSchema = z.object({
  providerId: z.string().min(1),
});

export function createProvidersController(
  registry: ProviderRegistry,
  sessionsService?: SessionsService,
) {
  const eventHub = createProviderEventHub(registry);

  return new Hono()
    .get(
      "/",
      describeRoute({
        description: "List registered AI providers and their capabilities",
        tags: ["Providers"],
        responses: { 200: { description: "Provider catalog" } },
      }),
      async (c) => c.json(await registry.catalog()),
    )
    .get(
      "/events",
      describeRoute({
        description: "Stream normalized events from all registered providers",
        tags: ["Providers"],
        responses: { 200: { description: "Cloudy provider event stream" } },
      }),
      zValidator("query", ProvidersModel.eventsQuerySchema),
      (c) => {
        const events = eventHub.subscribeEvents({
          ...c.req.valid("query"),
          signal: c.req.raw.signal,
        });

        return streamSSE(c, async (stream) => {
          await stream.writeSSE({
            event: "connected",
            data: JSON.stringify({ type: "connected" }),
          });
          const heartbeat = setInterval(() => {
            void stream.writeSSE({
              event: "heartbeat",
              data: JSON.stringify({ type: "heartbeat" }),
            });
          }, 15_000);

          try {
            for await (const rawEvent of events) {
              const event = sessionsService?.mapEvent(rawEvent) ?? rawEvent;
              await stream.writeSSE({
                event: event.type,
                data: JSON.stringify(event),
              });
            }
          } finally {
            clearInterval(heartbeat);
          }
        });
      },
    )
    .get(
      "/:providerId/events",
      describeRoute({
        description: "Stream normalized provider events",
        tags: ["Providers"],
        responses: {
          200: { description: "Normalized provider event stream" },
          404: { description: "Provider not found" },
        },
      }),
      zValidator("param", providerParamSchema),
      zValidator("query", ProvidersModel.eventsQuerySchema),
      (c) => {
        const { providerId } = c.req.valid("param");
        const { directory, sessionId } = c.req.valid("query");
        const events = registry.subscribeEvents(providerId, {
          directory,
          sessionId,
          signal: c.req.raw.signal,
        });

        return streamSSE(c, async (stream) => {
          await stream.writeSSE({
            event: "connected",
            data: JSON.stringify({ type: "connected" }),
          });
          const heartbeat = setInterval(() => {
            void stream.writeSSE({
              event: "heartbeat",
              data: JSON.stringify({ type: "heartbeat" }),
            });
          }, 15_000);

          try {
            for await (const rawEvent of events) {
              const event = sessionsService?.mapEvent(rawEvent) ?? rawEvent;
              await stream.writeSSE({
                event: event.type,
                data: JSON.stringify(event),
              });
            }
          } finally {
            clearInterval(heartbeat);
          }
        });
      },
    )
    .get(
      "/:providerId/sessions",
      zValidator("param", providerParamSchema),
      zValidator("query", ProvidersModel.sessionsQuerySchema),
      async (c) => {
        const { providerId } = c.req.valid("param");
        return c.json(
          await registry.listSessions(providerId, c.req.valid("query")),
        );
      },
    )
    .get(
      "/:providerId/sessions/:sessionId",
      zValidator(
        "param",
        providerParamSchema.merge(ProvidersModel.sessionParamSchema),
      ),
      zValidator("query", ProvidersModel.sessionsQuerySchema),
      async (c) => {
        const params = c.req.valid("param");
        return c.json(
          await registry.getSession(params.providerId, {
            sessionId: params.sessionId,
            directory: c.req.valid("query").directory,
          }),
        );
      },
    )
    .get(
      "/:providerId/sessions/:sessionId/children",
      zValidator(
        "param",
        providerParamSchema.merge(ProvidersModel.sessionParamSchema),
      ),
      zValidator("query", ProvidersModel.sessionsQuerySchema),
      async (c) => {
        const params = c.req.valid("param");
        return c.json(
          await registry.getSessionChildren(params.providerId, {
            sessionId: params.sessionId,
            directory: c.req.valid("query").directory,
          }),
        );
      },
    )
    .get(
      "/:providerId/sessions/status",
      zValidator("param", providerParamSchema),
      zValidator("query", ProvidersModel.sessionsQuerySchema),
      async (c) =>
        c.json(
          await registry.getSessionStatuses(
            c.req.valid("param").providerId,
            c.req.valid("query"),
          ),
        ),
    )
    .get(
      "/:providerId/sessions/:sessionId/messages",
      zValidator(
        "param",
        providerParamSchema.merge(ProvidersModel.sessionParamSchema),
      ),
      zValidator("query", ProvidersModel.messagesQuerySchema),
      async (c) => {
        const params = c.req.valid("param");
        return c.json(
          await registry.listMessages(params.providerId, {
            sessionId: params.sessionId,
            ...c.req.valid("query"),
          }),
        );
      },
    )
    .post(
      "/:providerId/sessions",
      zValidator("param", providerParamSchema),
      zValidator("json", ProvidersModel.sessionInputSchema),
      async (c) =>
        c.json(
          await registry.createSession(
            c.req.valid("param").providerId,
            c.req.valid("json"),
          ),
          201,
        ),
    )
    .patch(
      "/:providerId/sessions/:sessionId",
      zValidator(
        "param",
        providerParamSchema.merge(ProvidersModel.sessionParamSchema),
      ),
      zValidator("json", ProvidersModel.sessionInputSchema),
      async (c) =>
        c.json(
          await registry.updateSession(c.req.valid("param").providerId, {
            sessionId: c.req.valid("param").sessionId,
            ...c.req.valid("json"),
          }),
        ),
    )
    .delete(
      "/:providerId/sessions/:sessionId",
      zValidator(
        "param",
        providerParamSchema.merge(ProvidersModel.sessionParamSchema),
      ),
      zValidator("query", ProvidersModel.sessionsQuerySchema),
      async (c) => {
        const params = c.req.valid("param");
        await registry.deleteSession(params.providerId, {
          sessionId: params.sessionId,
          directory: c.req.valid("query").directory,
        });
        return c.body(null, 204);
      },
    )
    .post(
      "/:providerId/sessions/:sessionId/fork",
      zValidator(
        "param",
        providerParamSchema.merge(ProvidersModel.sessionParamSchema),
      ),
      zValidator("json", ProvidersModel.sessionInputSchema),
      async (c) =>
        c.json(
          await registry.forkSession(c.req.valid("param").providerId, {
            sessionId: c.req.valid("param").sessionId,
            ...c.req.valid("json"),
          }),
        ),
    )
    .post(
      "/:providerId/sessions/:sessionId/abort",
      zValidator(
        "param",
        providerParamSchema.merge(ProvidersModel.sessionParamSchema),
      ),
      zValidator("query", ProvidersModel.sessionsQuerySchema),
      async (c) => {
        const params = c.req.valid("param");
        await registry.abortSession(params.providerId, {
          sessionId: params.sessionId,
          directory: c.req.valid("query").directory,
        });
        return c.body(null, 204);
      },
    )
    .post(
      "/:providerId/messages",
      zValidator("param", providerParamSchema),
      zValidator("json", ProvidersModel.messageInputSchema),
      async (c) =>
        c.json(
          await registry.sendMessage(
            c.req.valid("param").providerId,
            c.req.valid("json"),
          ),
        ),
    )
    .get(
      "/:providerId/permissions",
      zValidator("param", providerParamSchema),
      zValidator("query", ProvidersModel.permissionsQuerySchema),
      async (c) =>
        c.json(
          await registry.listPermissions(
            c.req.valid("param").providerId,
            c.req.valid("query"),
          ),
        ),
    )
    .get(
      "/:providerId/questions",
      zValidator("param", providerParamSchema),
      zValidator("query", ProvidersModel.questionsQuerySchema),
      async (c) =>
        c.json(
          await registry.listQuestions(
            c.req.valid("param").providerId,
            c.req.valid("query"),
          ),
        ),
    )
    .post(
      "/:providerId/interactions",
      zValidator("param", providerParamSchema),
      zValidator("json", ProvidersModel.interactionInputSchema),
      async (c) =>
        c.json(
          await registry.respondToInteraction(
            c.req.valid("param").providerId,
            c.req.valid("json"),
          ),
        ),
    )
    .get(
      "/:providerId/files",
      zValidator("param", providerParamSchema),
      zValidator("query", ProvidersModel.filesQuerySchema),
      async (c) =>
        c.json(
          await registry.listFiles(
            c.req.valid("param").providerId,
            c.req.valid("query"),
          ),
        ),
    )
    .get(
      "/:providerId/file",
      zValidator("param", providerParamSchema),
      zValidator("query", ProvidersModel.fileReadQuerySchema),
      async (c) =>
        c.json(
          await registry.readFile(
            c.req.valid("param").providerId,
            c.req.valid("query"),
          ),
        ),
    )
    .get(
      "/:providerId/file-search",
      zValidator("param", providerParamSchema),
      zValidator("query", ProvidersModel.fileSearchQuerySchema),
      async (c) =>
        c.json(
          await registry.searchFiles(
            c.req.valid("param").providerId,
            c.req.valid("query"),
          ),
        ),
    )
    .get(
      "/:providerId/diff",
      zValidator("param", providerParamSchema),
      zValidator("query", ProvidersModel.diffQuerySchema),
      async (c) =>
        c.json(
          await registry.listDiff(
            c.req.valid("param").providerId,
            c.req.valid("query"),
          ),
        ),
    )
    .get(
      "/:providerId/commands",
      zValidator("param", providerParamSchema),
      zValidator("query", ProvidersModel.commandsQuerySchema),
      async (c) =>
        c.json(
          await registry.listCommands(
            c.req.valid("param").providerId,
            c.req.valid("query"),
          ),
        ),
    )
    .post(
      "/:providerId/command",
      zValidator("param", providerParamSchema),
      zValidator("json", ProvidersModel.commandInputSchema),
      async (c) =>
        c.json(
          await registry.executeCommand(
            c.req.valid("param").providerId,
            c.req.valid("json"),
          ),
        ),
    );
}
