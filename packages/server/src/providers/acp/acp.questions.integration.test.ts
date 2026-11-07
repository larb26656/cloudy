import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createAgentProviderRegistry, createProviderEventHub } from "../index";
import { createApp } from "../../server";
import { createTestApp } from "../../test-utils";
import { createSessionsRepository } from "../../features/sessions/sessions.repository";
import { createSessionsService } from "../../features/sessions/sessions.service";
import { createAcpAdapter } from "./acp.adapter";

const agent = `
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
let forms = false;
let lastQuestion;
const schema = {
  type: "object",
  properties: {
    destination: { type: "string", title: "Destination", minLength: 2, maxLength: 8, pattern: "^[a-z]+$" },
    vehicle: { type: "string", enum: ["rail", "air"], oneOf: [{ const: "rail", title: "Train" }, { const: "road", title: "Car" }], default: "rail" },
    supplies: { type: "array", items: { type: "string", enum: ["map", "water", "food"] }, minItems: 1, maxItems: 2 },
    extras: { type: "array", items: { type: "string", enum: [] } },
    passengers: { type: "integer", minimum: 0, maximum: 4 },
    ratio: { type: "number", minimum: 0, maximum: 1 },
    insured: { type: "boolean", default: true },
    note: { type: "string" },
  },
  required: ["destination", "vehicle", "supplies", "extras", "passengers", "ratio", "insured"],
};
const ompSchema = { type: "object", properties: {
  choice: { type: "string", enum: ["one", "other"] },
  custom: { type: "string" },
}, required: ["choice"] };
const server = acp.agent({ name: "form-fixture" })
  .onRequest(acp.methods.agent.initialize, ({ params }) => {
    forms = !!params.clientCapabilities?.elicitation?.form && !params.clientCapabilities?.elicitation?.url;
    return { protocolVersion: acp.PROTOCOL_VERSION, agentCapabilities: {
      sessionCapabilities: process.env.CLOUDY_TEST_CLOSE_ONLY ? { close: true } : { delete: true },
    } };
  })
  .onRequest(acp.methods.agent.session.new, ({ params }) => ({ sessionId: "native:" + process.pid + ":" + params.cwd }))
  .onRequest(acp.methods.agent.session.delete, async () => {
    if (lastQuestion && (await lastQuestion).action !== "cancel") throw new Error("Question was not cancelled");
    return {};
  })
  .onRequest(acp.methods.agent.session.close, async () => {
    if (lastQuestion && (await lastQuestion).action !== "cancel") throw new Error("Question was not cancelled");
    return {};
  })
  .onRequest(acp.methods.agent.session.prompt, async ({ params, client }) => {
    const command = params.prompt[0].text;
    if (!forms) return { stopReason: "end_turn", _meta: { result: "form-not-negotiated" } };
    const ask = (message, requestedSchema = schema, options) => client.request(acp.methods.client.elicitation.create, {
      mode: "form", sessionId: params.sessionId, toolCallId: "shared-tool", message, requestedSchema,
    }, options);
    if (command === "withdraw") {
      const controller = new AbortController();
      const question = ask("Withdrawn", schema, { cancellationSignal: controller.signal });
      const permission = await client.request(acp.methods.client.session.requestPermission, {
        sessionId: params.sessionId, toolCall: { toolCallId: "withdraw", title: "Continue" },
        options: [{ optionId: "allow", name: "Allow", kind: "allow_once" }],
      });
      controller.abort();
      const response = await question;
      return { stopReason: "end_turn", _meta: { result: response.action + ":" + permission.outcome.outcome } };
    }
    if (command === "finish-with-pending") {
      lastQuestion = ask("Unfinished");
      return { stopReason: "end_turn", _meta: { result: "finished" } };
    }
    if (command === "pending-result") {
      return { stopReason: "end_turn", _meta: { result: (await lastQuestion).action } };
    }
    if (command === "disconnect") {
      void ask("Disconnecting").catch(() => {});
      await client.notify(acp.methods.client.session.update, {
        sessionId: params.sessionId,
        update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: "Disconnecting" } },
      });
      process.stdout.write("", () => process.exit(0));
      return await new Promise(() => {});
    }
    if (command === "scope" || command === "url") {
      try {
        await client.request(acp.methods.client.elicitation.create, command === "scope"
          ? { mode: "form", requestId: "outside-session", message: "Unsupported", requestedSchema: schema }
          : { mode: "url", sessionId: params.sessionId, message: "Unsupported", elicitationId: "url-1", url: "https://example.com/" });
        return { stopReason: "end_turn", _meta: { result: "unexpected-success" } };
      } catch (error) {
        return { stopReason: "end_turn", _meta: { result: "rejected", code: error.code } };
      }
    }
    if (command === "multiple") {
      const [first, second, permission] = await Promise.all([
        ask("First"), ask("Second"),
        client.request(acp.methods.client.session.requestPermission, {
          sessionId: params.sessionId, toolCall: { toolCallId: "shared-tool", title: "Run" },
          options: [{ optionId: "allow", name: "Allow", kind: "allow_once" }],
        }),
      ]);
      return { stopReason: "end_turn", _meta: { result: first.action + ":" + second.action + ":" + permission.outcome.outcome } };
    }
    lastQuestion = ask(command === "omp" ? "Choose an answer" : "Plan the trip", command === "omp" ? ompSchema : schema);
    const response = await lastQuestion;
    lastQuestion = undefined;
    let result = response.action;
    if (response.action === "accept") {
      const c = response.content || {};
      if (command === "omp") result = c.choice === "other" && c.custom === "custom answer" ? "custom-selected" : "wrong-answer";
      else result = c.destination === "oslo" && c.vehicle === "rail" && Array.isArray(c.supplies) && c.supplies.join(",") === "map,water" && Array.isArray(c.extras) && c.extras.length === 0 && c.passengers === 0 && c.ratio === 0.5 && c.insured === false && !("note" in c) ? "trip-booked" : "wrong-answer";
    }
    return { stopReason: "end_turn", _meta: { result } };
  });
server.connect(acp.ndJsonStream(Writable.toWeb(process.stdout), Readable.toWeb(process.stdin)));
`;

function setup(closeOnly = false) {
  const env = createTestApp();
  const provider = createAcpAdapter({
    id: "acp-test",
    name: "Test agent",
    launch: {
      command: process.execPath,
      args: ["--input-type=module", "--eval", agent],
      ...(closeOnly ? { env: { CLOUDY_TEST_CLOSE_ONLY: "1" } } : {}),
    },
    timeoutMs: 2000,
  });
  const registry = createAgentProviderRegistry({ providers: [provider] });
  const service = createSessionsService(
    createSessionsRepository(env.db.db),
    registry,
  );
  const hub = createProviderEventHub(registry, {
    onEvent: (event) => service.applyEvent(event),
  });
  env.container.agentProviderRegistry = registry;
  env.container.sessionsService = service;
  env.container.providerEventHub = hub;
  return {
    ...env,
    provider,
    service,
    hub,
    app: createApp({ container: env.container }),
  };
}

const json = (value: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(value),
});

const answer = {
  destination: "oslo",
  vehicle: "rail",
  supplies: ["map", "water"],
  extras: [],
  passengers: 0,
  ratio: 0.5,
  insured: false,
};

type TestEnv = ReturnType<typeof setup>;
type Question = {
  id: string;
  sessionId: string;
  form: { message: string; agent: string; schema: unknown };
};
type StreamEvent = { type: string; sessionId?: string; request: Question };

async function createSession(env: TestEnv, directory = process.cwd()) {
  const response = await env.app.request(
    "/api/sessions",
    json({ providerId: "acp-test", directory }),
  );
  expect(response.status).toBe(201);
  return (await response.json()) as { id: string };
}

async function stream(env: TestEnv) {
  const response = await env.app.request("/api/agent-providers/events");
  expect(response.status).toBe(200);
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  return {
    async next(type: string | string[]): Promise<StreamEvent> {
      while (true) {
        const boundary = buffer.indexOf("\n\n");
        if (boundary >= 0) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const event = frame
            .split("\n")
            .find((line) => line.startsWith("event: "))
            ?.slice(7);
          const data = frame
            .split("\n")
            .find((line) => line.startsWith("data: "))
            ?.slice(6);
          if (
            (Array.isArray(type)
              ? type.includes(event ?? "")
              : event === type) &&
            data
          )
            return JSON.parse(data);
          continue;
        }
        const chunk = await reader.read();
        if (chunk.done) throw new Error(`SSE closed before ${type}`);
        buffer += decoder
          .decode(chunk.value, { stream: true })
          .replaceAll("\r\n", "\n");
      }
    },
    close: () => reader.cancel(),
  };
}

function send(env: TestEnv, id: string, content: string) {
  return Promise.resolve(
    env.app.request(`/api/sessions/${id}/messages`, json({ content })),
  );
}

async function questions(env: TestEnv, id: string): Promise<Question[]> {
  const response = await env.app.request(`/api/sessions/${id}/questions`);
  expect(response.status).toBe(200);
  return response.json();
}

function reply(
  env: TestEnv,
  sessionId: string,
  questionId: string,
  value: unknown,
) {
  return env.app.request(
    `/api/sessions/${sessionId}/questions/${encodeURIComponent(questionId)}`,
    json({ value }),
  );
}

async function cleanup(
  env: TestEnv,
  ids: string[],
  pending: Promise<unknown>[],
  events: Awaited<ReturnType<typeof stream>>,
) {
  for (const id of ids)
    await Promise.resolve()
      .then(() => env.service.abort(id))
      .catch(() => {});
  await Promise.allSettled(pending);
  await env.hub.stop();
  await events.close();
  env.close();
}

describe("ACP forms through the HTTP and SSE interfaces", () => {
  it("negotiates forms, publishes a mapped question, rejects invalid content and continues with typed values", async () => {
    const env = setup();
    const events = await stream(env);
    const ids: string[] = [];
    const pending: Promise<unknown>[] = [];
    try {
      await events.next("connected");
      const catalog = await (
        await env.app.request("/api/agent-providers")
      ).json();
      expect(catalog.providers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "acp-test",
            capabilities: expect.objectContaining({ questions: true }),
          }),
        ]),
      );
      const session = await createSession(env);
      ids.push(session.id);
      const sending = send(env, session.id, "trip");
      pending.push(sending);
      const event = await events.next("question.requested");
      expect(event).toMatchObject({
        sessionId: session.id,
        request: {
          sessionId: session.id,
          form: {
            message: "Plan the trip",
            agent: expect.any(String),
            schema: {
              properties: {
                vehicle: {
                  enum: ["rail", "air"],
                  oneOf: [
                    { const: "rail", title: "Train" },
                    { const: "road", title: "Car" },
                  ],
                },
              },
            },
          },
        },
      });
      const [question] = await questions(env, session.id);
      expect(question).toMatchObject({
        id: event.request.id,
        sessionId: session.id,
        form: {
          message: "Plan the trip",
          agent: expect.any(String),
          schema: {
            properties: {
              vehicle: {
                default: "rail",
                enum: ["rail", "air"],
                oneOf: [
                  { const: "rail", title: "Train" },
                  { const: "road", title: "Car" },
                ],
              },
              extras: { type: "array", items: { type: "string", enum: [] } },
              insured: { default: true },
            },
          },
        },
      });
      expect(await env.service.hasPendingInteractions(session.id)).toBe(true);
      for (const content of [
        { ...answer, destination: "x" },
        { ...answer, destination: "OSLO" },
        { ...answer, vehicle: "Train" },
        { ...answer, vehicle: "road" },
        { ...answer, vehicle: "air" },
        { ...answer, supplies: [] },
        { ...answer, extras: ["unavailable"] },
        { ...answer, extras: undefined },
        { ...answer, passengers: 0.5 },
        { ...answer, ratio: 2 },
        { ...answer, insured: "false" },
        { ...answer, destination: undefined },
      ]) {
        expect(
          (
            await reply(env, session.id, question!.id, {
              action: "accept",
              content,
            })
          ).status,
        ).toBe(400);
        expect(await questions(env, session.id)).toHaveLength(1);
        expect(await env.service.hasPendingInteractions(session.id)).toBe(true);
      }
      expect(
        (
          await reply(env, session.id, question!.id, {
            action: "accept",
            content: answer,
          })
        ).status,
      ).toBe(200);
      expect(await questions(env, session.id)).toEqual([]);
      expect(await env.service.hasPendingInteractions(session.id)).toBe(false);
      expect(await (await sending).json()).toMatchObject({
        value: { _meta: { result: "trip-booked" } },
      });
      expect(
        (
          await reply(env, session.id, question!.id, {
            action: "accept",
            content: answer,
          })
        ).status,
      ).toBe(404);
    } finally {
      await cleanup(env, ids, pending, events);
    }
  });

  it.each(["decline", "cancel"])(
    "delivers %s as a distinct form action",
    async (action) => {
      const env = setup();
      const events = await stream(env);
      const ids: string[] = [];
      const pending: Promise<unknown>[] = [];
      try {
        await events.next("connected");
        const session = await createSession(env);
        ids.push(session.id);
        const sending = send(env, session.id, "trip");
        pending.push(sending);
        await events.next("question.requested");
        const [question] = await questions(env, session.id);
        expect(
          (await reply(env, session.id, question!.id, { action })).status,
        ).toBe(200);
        expect(await (await sending).json()).toMatchObject({
          value: { _meta: { result: action } },
        });
        expect(await questions(env, session.id)).toEqual([]);
        expect(await env.service.hasPendingInteractions(session.id)).toBe(
          false,
        );
        expect(
          (await reply(env, session.id, question!.id, { action })).status,
        ).toBe(404);
      } finally {
        await cleanup(env, ids, pending, events);
      }
    },
  );

  it("uses the same generic form path for an OMP-shaped custom answer", async () => {
    const env = setup();
    const events = await stream(env);
    const ids: string[] = [];
    const pending: Promise<unknown>[] = [];
    try {
      await events.next("connected");
      const session = await createSession(env);
      ids.push(session.id);
      const sending = send(env, session.id, "omp");
      pending.push(sending);
      await events.next("question.requested");
      const [question] = await questions(env, session.id);
      expect(
        (
          await reply(env, session.id, question!.id, {
            action: "accept",
            content: { choice: "other", custom: "custom answer" },
          })
        ).status,
      ).toBe(200);
      expect(await (await sending).json()).toMatchObject({
        value: { _meta: { result: "custom-selected" } },
      });
    } finally {
      await cleanup(env, ids, pending, events);
    }
  });

  it.each(["scope", "url"])(
    "rejects unsupported %s without leaving a pending question",
    async (command) => {
      const env = setup();
      const events = await stream(env);
      const ids: string[] = [];
      const pending: Promise<unknown>[] = [];
      try {
        await events.next("connected");
        const session = await createSession(env);
        ids.push(session.id);
        const response = await send(env, session.id, command);
        expect(await response.json()).toMatchObject({
          value: { _meta: { result: "rejected", code: expect.any(Number) } },
        });
        expect(await questions(env, session.id)).toEqual([]);
        expect(await env.service.hasPendingInteractions(session.id)).toBe(
          false,
        );
      } finally {
        await cleanup(env, ids, pending, events);
      }
    },
  );

  it("isolates simultaneous sessions and independently resolves questions sharing a tool with a permission", async () => {
    const env = setup();
    const events = await stream(env);
    const ids: string[] = [];
    const pending: Promise<unknown>[] = [];
    try {
      await events.next("connected");
      const first = await createSession(env);
      const second = await createSession(
        env,
        fileURLToPath(new URL("../../", import.meta.url)),
      );
      const sameDirectory = await createSession(env);
      ids.push(first.id, second.id, sameDirectory.id);
      const firstSend = send(env, first.id, "multiple");
      const secondSend = send(env, second.id, "trip");
      const sameDirectorySend = send(env, sameDirectory.id, "trip");
      pending.push(firstSend, secondSend, sameDirectorySend);
      const seen: StreamEvent[] = [];
      while (
        seen.filter((event) => event.type === "question.requested").length <
          4 ||
        !seen.some((event) => event.type === "approval.requested")
      )
        seen.push(
          await events.next(["question.requested", "approval.requested"]),
        );
      const firstQuestions = await questions(env, first.id);
      const secondQuestions = await questions(env, second.id);
      const sameDirectoryQuestions = await questions(env, sameDirectory.id);
      expect(firstQuestions).toHaveLength(2);
      expect(secondQuestions).toHaveLength(1);
      expect(sameDirectoryQuestions).toHaveLength(1);
      expect(new Set(firstQuestions.map((question) => question.id)).size).toBe(
        2,
      );
      const providerQuestions = (await (
        await env.app.request(
          `/api/agent-providers/acp-test/questions?directory=${encodeURIComponent(process.cwd())}`,
        )
      ).json()) as Question[];
      expect(providerQuestions).toHaveLength(3);
      expect(new Set(providerQuestions.map((question) => question.id))).toEqual(
        new Set(
          [...firstQuestions, ...sameDirectoryQuestions].map(
            (question) => question.id,
          ),
        ),
      );
      expect(await env.service.hasPendingInteractions(sameDirectory.id)).toBe(
        true,
      );
      expect(providerQuestions[0]!.sessionId).not.toBe(first.id);
      expect(
        (
          await env.app.request(
            "/api/agent-providers/acp-test/interactions",
            json({
              kind: "question",
              sessionId: providerQuestions[0]!.sessionId,
              interactionId: providerQuestions[0]!.id,
              directory: "/not-the-session-directory",
              value: { action: "decline" },
            }),
          )
        ).status,
      ).toBe(404);
      expect(
        seen.filter(
          (event) =>
            event.type === "question.requested" && event.sessionId === first.id,
        ),
      ).toHaveLength(2);
      expect(
        seen.filter(
          (event) =>
            event.type === "question.requested" &&
            event.sessionId === second.id,
        ),
      ).toHaveLength(1);
      expect(
        seen.filter(
          (event) =>
            event.type === "question.requested" &&
            event.sessionId === sameDirectory.id,
        ),
      ).toHaveLength(1);
      expect(
        (
          await reply(env, second.id, firstQuestions[0]!.id, {
            action: "decline",
          })
        ).status,
      ).toBe(404);
      expect(
        (
          await reply(env, sameDirectory.id, firstQuestions[0]!.id, {
            action: "decline",
          })
        ).status,
      ).toBe(404);
      expect(await questions(env, first.id)).toHaveLength(2);
      const firstByMessage = firstQuestions.find(
        (q) => q.form.message === "First",
      )!;
      const secondByMessage = firstQuestions.find(
        (q) => q.form.message === "Second",
      )!;
      expect(
        (await reply(env, first.id, firstByMessage.id, { action: "decline" }))
          .status,
      ).toBe(200);
      expect(await events.next("question.resolved")).toMatchObject({
        sessionId: first.id,
        interactionId: firstByMessage.id,
      });
      expect(await questions(env, first.id)).toEqual([secondByMessage]);
      expect(await env.service.hasPendingInteractions(first.id)).toBe(true);
      expect(
        (await reply(env, first.id, secondByMessage.id, { action: "cancel" }))
          .status,
      ).toBe(200);
      expect(await env.service.hasPendingInteractions(first.id)).toBe(true);
      const permissions = await (
        await env.app.request(`/api/sessions/${first.id}/permissions`)
      ).json();
      expect(permissions).toHaveLength(1);
      expect(
        (await reply(env, first.id, permissions[0].id, { action: "cancel" }))
          .status,
      ).toBe(404);
      expect(
        await (
          await env.app.request(`/api/sessions/${first.id}/permissions`)
        ).json(),
      ).toEqual(permissions);
      expect(
        (
          await env.app.request(
            `/api/sessions/${first.id}/permissions/${encodeURIComponent(permissions[0].id)}`,
            json({ reply: "once" }),
          )
        ).status,
      ).toBe(200);
      expect(await (await firstSend).json()).toMatchObject({
        value: { _meta: { result: "decline:cancel:selected" } },
      });
      expect(await env.service.hasPendingInteractions(first.id)).toBe(false);
      expect(await questions(env, second.id)).toHaveLength(1);
      expect(
        (
          await reply(env, second.id, secondQuestions[0]!.id, {
            action: "accept",
            content: answer,
          })
        ).status,
      ).toBe(200);
      expect(await (await secondSend).json()).toMatchObject({
        value: { _meta: { result: "trip-booked" } },
      });
      expect(await questions(env, sameDirectory.id)).toHaveLength(1);
      expect(
        (
          await reply(env, sameDirectory.id, sameDirectoryQuestions[0]!.id, {
            action: "decline",
          })
        ).status,
      ).toBe(200);
      expect(await (await sameDirectorySend).json()).toMatchObject({
        value: { _meta: { result: "decline" } },
      });
    } finally {
      await cleanup(env, ids, pending, events);
    }
  });
  it("allows only one competing answer to complete a question", async () => {
    const env = setup();
    const events = await stream(env);
    const ids: string[] = [];
    const pending: Promise<unknown>[] = [];
    try {
      await events.next("connected");
      const session = await createSession(env);
      ids.push(session.id);
      const sending = send(env, session.id, "trip");
      pending.push(sending);
      await events.next("question.requested");
      const [question] = await questions(env, session.id);
      const responses = await Promise.all([
        reply(env, session.id, question!.id, { action: "decline" }),
        reply(env, session.id, question!.id, { action: "cancel" }),
      ]);
      expect(responses.map((response) => response.status).sort()).toEqual([
        200, 404,
      ]);
      const winner = responses[0]!.status === 200 ? "decline" : "cancel";
      expect(await (await sending).json()).toMatchObject({
        value: { _meta: { result: winner } },
      });
      expect(await questions(env, session.id)).toEqual([]);
    } finally {
      await cleanup(env, ids, pending, events);
    }
  });

  it("retires a withdrawn request without consuming a permission", async () => {
    const env = setup();
    const events = await stream(env);
    const ids: string[] = [];
    const pending: Promise<unknown>[] = [];
    try {
      await events.next("connected");
      const session = await createSession(env);
      ids.push(session.id);
      const sending = send(env, session.id, "withdraw");
      pending.push(sending);
      const seen: StreamEvent[] = [];
      while (seen.length < 2)
        seen.push(
          await events.next(["question.requested", "approval.requested"]),
        );
      const question = (await questions(env, session.id))[0]!;
      const permissions = await (
        await env.app.request(`/api/sessions/${session.id}/permissions`)
      ).json();
      expect(permissions).toHaveLength(1);
      expect(
        (
          await env.app.request(
            `/api/sessions/${session.id}/permissions/${encodeURIComponent(permissions[0].id)}`,
            json({ reply: "once" }),
          )
        ).status,
      ).toBe(200);
      expect(await events.next("question.resolved")).toMatchObject({
        sessionId: session.id,
        interactionId: question.id,
      });
      expect(await (await sending).json()).toMatchObject({
        value: { _meta: { result: "cancel:selected" } },
      });
      expect(await questions(env, session.id)).toEqual([]);
      expect(await env.service.hasPendingInteractions(session.id)).toBe(false);
      expect(
        (await reply(env, session.id, question.id, { action: "decline" }))
          .status,
      ).toBe(404);
    } finally {
      await cleanup(env, ids, pending, events);
    }
  });

  it.each([false, true])(
    "sends cancellation before deleting a session (close-only: %s)",
    async (closeOnly) => {
      const env = setup(closeOnly);
      const events = await stream(env);
      const ids: string[] = [];
      const pending: Promise<unknown>[] = [];
      try {
        await events.next("connected");
        const session = await createSession(env);
        ids.push(session.id);
        const sending = send(env, session.id, "trip");
        pending.push(sending);
        const event = await events.next("question.requested");
        const deleted = await env.app.request(`/api/sessions/${session.id}`, {
          method: "DELETE",
        });
        expect(deleted.status).toBe(204);
        expect(await events.next("question.resolved")).toMatchObject({
          sessionId: session.id,
          interactionId: event.request.id,
        });
        expect(
          (
            await reply(env, session.id, event.request.id, {
              action: "decline",
            })
          ).status,
        ).toBe(404);
        await sending;
      } finally {
        await cleanup(env, ids, pending, events);
      }
    },
  );

  it.each(["abort", "delete"])(
    "retires pending questions on session %s",
    async (action) => {
      const env = setup();
      const events = await stream(env);
      const ids: string[] = [];
      const pending: Promise<unknown>[] = [];
      try {
        await events.next("connected");
        const session = await createSession(env);
        ids.push(session.id);
        const sending = send(env, session.id, "trip");
        pending.push(sending);
        await events.next("question.requested");
        const [question] = await questions(env, session.id);
        expect(
          (
            await reply(env, session.id, question!.id, {
              action: "accept",
              content: {},
            })
          ).status,
        ).toBe(400);
        const stopped =
          action === "abort"
            ? await env.app.request(`/api/sessions/${session.id}/abort`, {
                method: "POST",
              })
            : await env.app.request(`/api/sessions/${session.id}`, {
                method: "DELETE",
              });
        expect(stopped.status).toBe(204);
        if (action === "abort") {
          expect(await questions(env, session.id)).toEqual([]);
          expect(await env.service.hasPendingInteractions(session.id)).toBe(
            false,
          );
        } else {
          expect(
            await (
              await env.app.request("/api/agent-providers/acp-test/questions")
            ).json(),
          ).toEqual([]);
        }
        expect(
          (
            await reply(env, session.id, question!.id, {
              action: "accept",
              content: answer,
            })
          ).status,
        ).toBe(404);
        await sending;
      } finally {
        await cleanup(env, ids, pending, events);
      }
    },
  );
  it("rejects a reply racing stop without disturbing another session", async () => {
    const env = setup();
    const events = await stream(env);
    const ids: string[] = [];
    const pending: Promise<unknown>[] = [];
    try {
      await events.next("connected");
      const first = await createSession(env);
      const second = await createSession(env);
      ids.push(first.id, second.id);
      const firstSend = send(env, first.id, "trip");
      const secondSend = send(env, second.id, "trip");
      pending.push(firstSend, secondSend);
      await events.next("question.requested");
      await events.next("question.requested");
      const [firstQuestion] = await questions(env, first.id);
      const [secondQuestion] = await questions(env, second.id);
      const [response, stopped] = await Promise.all([
        reply(env, first.id, firstQuestion!.id, { action: "decline" }),
        env.app.request(`/api/sessions/${first.id}/abort`, { method: "POST" }),
      ]);
      expect([200, 404]).toContain(response.status);
      expect(stopped.status).toBe(204);
      expect(await questions(env, first.id)).toEqual([]);
      expect(
        (await reply(env, first.id, firstQuestion!.id, { action: "cancel" }))
          .status,
      ).toBe(404);
      expect(await questions(env, second.id)).toEqual([secondQuestion]);
      expect(await env.service.hasPendingInteractions(second.id)).toBe(true);
      expect(
        (await reply(env, second.id, secondQuestion!.id, { action: "decline" }))
          .status,
      ).toBe(200);
      expect(await (await secondSend).json()).toMatchObject({
        value: { _meta: { result: "decline" } },
      });
      await firstSend;
    } finally {
      await cleanup(env, ids, pending, events);
    }
  });

  it("retires a question when its owning prompt completes without awaiting it", async () => {
    const env = setup();
    const events = await stream(env);
    const ids: string[] = [];
    const pending: Promise<unknown>[] = [];
    try {
      await events.next("connected");
      const session = await createSession(env);
      ids.push(session.id);
      const sending = send(env, session.id, "finish-with-pending");
      pending.push(sending);
      const event = await events.next("question.requested");
      expect(event.sessionId).toBe(session.id);
      expect(await (await sending).json()).toMatchObject({
        value: { _meta: { result: "finished" } },
      });
      expect(await questions(env, session.id)).toEqual([]);
      expect(await env.service.hasPendingInteractions(session.id)).toBe(false);
      expect(
        (await reply(env, session.id, event.request.id, { action: "cancel" }))
          .status,
      ).toBe(404);
      expect(await events.next("question.resolved")).toMatchObject({
        sessionId: session.id,
        interactionId: event.request.id,
      });
      expect(
        await (await send(env, session.id, "pending-result")).json(),
      ).toMatchObject({
        value: { _meta: { result: "cancel" } },
      });
    } finally {
      await cleanup(env, ids, pending, events);
    }
  });
  it("retires a disconnected agent's question and does not restore it on a fresh connection", async () => {
    const env = setup();
    const events = await stream(env);
    const ids: string[] = [];
    const pending: Promise<unknown>[] = [];
    try {
      await events.next("connected");
      const session = await createSession(env);
      ids.push(session.id);
      const sending = send(env, session.id, "disconnect");
      pending.push(sending);
      const event = await events.next("question.requested");
      expect(event.sessionId).toBe(session.id);
      expect(await events.next("question.resolved")).toMatchObject({
        sessionId: session.id,
        interactionId: event.request.id,
      });
      await sending;
      expect(await questions(env, session.id)).toEqual([]);
      expect(await env.service.hasPendingInteractions(session.id)).toBe(false);
      expect(
        (await reply(env, session.id, event.request.id, { action: "cancel" }))
          .status,
      ).toBe(404);
      const fresh = await createSession(env);
      ids.push(fresh.id);
      expect(await questions(env, fresh.id)).toEqual([]);
      expect(await env.service.hasPendingInteractions(fresh.id)).toBe(false);
    } finally {
      await cleanup(env, ids, pending, events);
    }
  });
});
