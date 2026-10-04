import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { SessionsService } from "./sessions.service";
import { SessionsModel } from "./sessions.model";

export function createSessionsController(service: SessionsService) {
  return new Hono()
    .get("/", zValidator("query", SessionsModel.sessionQuerySchema), (c) =>
      c.json(service.list(c.req.valid("query"))),
    )
    .post(
      "/",
      zValidator("json", SessionsModel.createSessionSchema),
      async (c) => c.json(await service.create(c.req.valid("json")), 201),
    )
    .get(
      "/:sessionId",
      zValidator("param", SessionsModel.sessionParamSchema),
      async (c) => c.json(await service.get(c.req.valid("param").sessionId)),
    )
    .patch(
      "/:sessionId",
      zValidator("param", SessionsModel.sessionParamSchema),
      zValidator("json", SessionsModel.updateSessionSchema),
      async (c) =>
        c.json(
          await service.update(
            c.req.valid("param").sessionId,
            c.req.valid("json"),
          ),
        ),
    )
    .delete(
      "/:sessionId",
      zValidator("param", SessionsModel.sessionParamSchema),
      async (c) => {
        await service.delete(c.req.valid("param").sessionId);
        return c.body(null, 204);
      },
    )
    .get(
      "/:sessionId/children",
      zValidator("param", SessionsModel.sessionParamSchema),
      async (c) =>
        c.json(await service.children(c.req.valid("param").sessionId)),
    )
    .get(
      "/:sessionId/status",
      zValidator("param", SessionsModel.sessionParamSchema),
      async (c) => c.json(await service.status(c.req.valid("param").sessionId)),
    )
    .get(
      "/:sessionId/messages",
      zValidator("param", SessionsModel.sessionParamSchema),
      zValidator("query", SessionsModel.messagesQuerySchema),
      async (c) =>
        c.json(
          await service.messages(
            c.req.valid("param").sessionId,
            c.req.valid("query"),
          ),
        ),
    )
    .get(
      "/:sessionId/questions",
      zValidator("param", SessionsModel.sessionParamSchema),
      async (c) =>
        c.json(await service.questions(c.req.valid("param").sessionId)),
    )
    .post(
      "/:sessionId/questions/:questionId",
      zValidator("param", SessionsModel.questionParamSchema),
      zValidator("json", SessionsModel.questionResponseSchema),
      async (c) => {
        const { sessionId, questionId } = c.req.valid("param");
        return c.json(
          await service.respondToQuestion(
            sessionId,
            questionId,
            c.req.valid("json").value,
          ),
        );
      },
    )
    .get(
      "/:sessionId/permissions",
      zValidator("param", SessionsModel.sessionParamSchema),
      async (c) =>
        c.json(await service.permissions(c.req.valid("param").sessionId)),
    )
    .post(
      "/:sessionId/permissions/:permissionId",
      zValidator("param", SessionsModel.permissionParamSchema),
      zValidator("json", SessionsModel.permissionResponseSchema),
      async (c) => {
        const { sessionId, permissionId } = c.req.valid("param");
        return c.json(
          await service.respondToPermission(
            sessionId,
            permissionId,
            c.req.valid("json").reply,
          ),
        );
      },
    )
    .post(
      "/:sessionId/messages",
      zValidator("param", SessionsModel.sessionParamSchema),
      zValidator("json", SessionsModel.messageInputSchema),
      async (c) =>
        c.json(
          await service.sendMessage(
            c.req.valid("param").sessionId,
            c.req.valid("json"),
          ),
        ),
    )
    .post(
      "/:sessionId/command",
      zValidator("param", SessionsModel.sessionParamSchema),
      zValidator("json", SessionsModel.commandInputSchema),
      async (c) => {
        await service.executeCommand(
          c.req.valid("param").sessionId,
          c.req.valid("json"),
        );
        return c.body(null, 204);
      },
    )
    .post(
      "/:sessionId/fork",
      zValidator("param", SessionsModel.sessionParamSchema),
      zValidator("json", SessionsModel.forkSessionSchema),
      async (c) =>
        c.json(
          await service.fork(
            c.req.valid("param").sessionId,
            c.req.valid("json"),
          ),
        ),
    )
    .post(
      "/:sessionId/abort",
      zValidator("param", SessionsModel.sessionParamSchema),
      async (c) => {
        await service.abort(c.req.valid("param").sessionId);
        return c.body(null, 204);
      },
    );
}
