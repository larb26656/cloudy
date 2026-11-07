import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createAgentProviderRegistry } from "../provider.registry";
import { createApp } from "../../server";
import { createTestApp } from "../../test-utils";
import { createSessionsRepository } from "../../features/sessions/sessions.repository";
import { createSessionsService } from "../../features/sessions/sessions.service";
import { createAcpAdapter } from "./acp.adapter";
import { ValidationError } from "../../shared/domain-error";
import type {
  ChatEvent,
  ChatSession,
  InteractionResponse,
} from "@repo/ai-core";

const agent = `
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
const profile = process.argv.at(-1);
let opened = false;
const server = acp.agent({ name: "unavailable" })
  .onRequest(acp.methods.agent.initialize, () => ({
    protocolVersion: acp.PROTOCOL_VERSION,
    agentCapabilities: {
      loadSession: profile === "failed-load",
      sessionCapabilities: profile === "resume" ? { resume: {} } : {},
    },
  }))
  .onRequest(acp.methods.agent.session.new, ({ params }) => {
    opened = true;
    return { sessionId: profile.startsWith("permissions") ? "permission:" + params.cwd : "original" };
  })
  .onRequest(acp.methods.agent.session.load, () => { throw new Error("load failed"); })
  .onRequest(acp.methods.agent.session.resume, () => { opened = true; return {}; })
  .onRequest(acp.methods.agent.session.prompt, async ({ params, client }) => {
    if (profile.startsWith("permissions")) {
      const options = [
        { optionId: "deny-persistent", name: "Never", kind: "reject_always" },
        { optionId: "run-a7", name: "Once", kind: "allow_once" },
        { optionId: "run-p9", name: "Always", kind: "allow_always" },
        { optionId: "deny-z4", name: "Reject", kind: "reject_once" },
      ].filter((option) => profile !== "permissions-limited" || option.kind !== "allow_always");
      const response = await client.request(acp.methods.client.session.requestPermission, {
        sessionId: params.sessionId,
        toolCall: { toolCallId: "tool-1", title: "Run command", rawInput: { command: "echo hello" } },
        options,
      });
      return { stopReason: "end_turn", _meta: { permissionOutcome: response.outcome } };
    }
    if (!opened && profile !== "direct") throw new Error("session not found");
    return { stopReason: "end_turn" };
  });
server.connect(acp.ndJsonStream(Writable.toWeb(process.stdout), Readable.toWeb(process.stdin)));
`;

function adapter(profile: string) {
  return createAcpAdapter({
    id: "acp-test",
    name: "Test agent",
    launch: {
      command: process.execPath,
      args: ["--input-type=module", "--eval", agent, profile],
    },
    timeoutMs: 2000,
  });
}

describe("unavailable ACP sessions", () => {
  it("retains the binding and exposes an empty unavailable history and send error through the session API", async () => {
    const env = createTestApp();
    const provider = adapter("unavailable");
    const registry = createAgentProviderRegistry({ providers: [provider] });
    env.container.agentProviderRegistry = registry;
    env.container.sessionsService = createSessionsService(
      createSessionsRepository(env.db.db),
      registry,
    );
    const app = createApp({ container: env.container });
    try {
      const created = await app.request("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerId: "acp-test",
          directory: process.cwd(),
        }),
      });
      expect(created.status).toBe(201);
      const { id } = await created.json();
      await provider.abortSession({ sessionId: "original" });
      const history = await app.request(`/api/sessions/${id}/messages`);
      expect(await history.json()).toMatchObject({
        messages: [],
        historyUnavailable: true,
      });
      const sent = await app.request(`/api/sessions/${id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "unsent draft" }),
      });
      expect(sent.status).toBe(409);
      expect(await sent.json()).toMatchObject({
        error: expect.stringContaining("original session"),
      });
      const listed = await app.request("/api/sessions");
      expect(await listed.json()).toEqual(
        expect.arrayContaining([expect.objectContaining({ id })]),
      );
    } finally {
      env.close();
    }
  });

  it.each(["resume", "direct"])(
    "can continue with %s even without history",
    async (profile) => {
      const provider = adapter(profile);
      await provider.createSession({ directory: process.cwd() });
      await provider.abortSession({ sessionId: "original" });
      expect(
        await provider.listMessages!({
          sessionId: "original",
          directory: process.cwd(),
        }),
      ).toMatchObject({
        messages: [],
        historyUnavailable: true,
      });
      await expect(
        provider.sendMessage({ sessionId: "original", content: "hello" }),
      ).resolves.toBeDefined();
      await provider.abortSession({ sessionId: "original" });
    },
  );

  it("treats an advertised but failing history load as unavailable", async () => {
    const provider = adapter("failed-load");
    await provider.createSession({ directory: process.cwd() });
    await provider.abortSession({ sessionId: "original" });
    expect(
      await provider.listMessages!({
        sessionId: "original",
        directory: process.cwd(),
      }),
    ).toMatchObject({
      messages: [],
      historyUnavailable: true,
    });
    await provider.abortSession({ sessionId: "original" });
  });
});

function createPermissionApp(profile = "permissions") {
  const env = createTestApp();
  const provider = adapter(profile);
  const registry = createAgentProviderRegistry({ providers: [provider] });
  const service = createSessionsService(
    createSessionsRepository(env.db.db),
    registry,
  );
  env.container.agentProviderRegistry = registry;
  env.container.sessionsService = service;
  return {
    ...env,
    provider,
    service,
    app: createApp({ container: env.container }),
  };
}

async function nextApproval(events: AsyncIterator<ChatEvent>) {
  while (true) {
    const event = await events.next();
    if (event.done)
      throw new Error("ACP event stream closed before permission request");
    if (event.value.type === "approval.requested") return event.value;
  }
}

describe("ACP permissions through the sessions API", () => {
  it.each([
    ["once", "run-a7"],
    ["always", "run-p9"],
    ["reject", "deny-z4"],
  ])(
    "maps the UI %s reply to the offered option kind in a restored session",
    async (reply, optionId) => {
      const env = createPermissionApp();
      const { app, provider, service } = env;
      const directory = process.cwd();
      const nativeId = `permission:${directory}`;
      const events = provider.subscribeEvents()[Symbol.asyncIterator]();
      let sending: Promise<Response> | undefined;
      try {
        const created = await app.request("/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ providerId: provider.id, directory }),
        });
        expect(created.status).toBe(201);
        const { id } = await created.json();
        expect(id).not.toBe(nativeId);
        expect(
          await (await app.request(`/api/sessions/${id}/permissions`)).json(),
        ).toEqual([]);
        await provider.abortSession({ sessionId: nativeId });

        sending = Promise.resolve(
          app.request(`/api/sessions/${id}/messages`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ content: "run command" }),
          }),
        );
        const approval = await nextApproval(events);
        expect(approval).toMatchObject({
          sessionId: nativeId,
          directory,
          request: {
            id: `${nativeId}:tool-1`,
            sessionId: nativeId,
            permission: "Run command",
            metadata: {
              toolCallId: "tool-1",
              options: [
                { optionId: "deny-persistent", kind: "reject_always" },
                { optionId: "run-a7", kind: "allow_once" },
                { optionId: "run-p9", kind: "allow_always" },
                { optionId: "deny-z4", kind: "reject_once" },
              ],
            },
          },
        });
        const pending = await app.request(`/api/sessions/${id}/permissions`);
        expect(pending.status).toBe(200);
        expect(await pending.json()).toEqual([
          { ...approval.request, sessionId: id },
        ]);
        expect(await service.hasPendingInteractions(id)).toBe(true);

        const permissionPath = `/api/sessions/${id}/permissions/${encodeURIComponent(approval.request.id)}`;
        const answered = await app.request(permissionPath, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reply }),
        });
        expect(answered.status).toBe(200);
        expect(
          await (await app.request(`/api/sessions/${id}/permissions`)).json(),
        ).toEqual([]);
        expect(await service.hasPendingInteractions(id)).toBe(false);
        const sent = await sending;
        expect(sent.status).toBe(200);
        expect(await sent.json()).toMatchObject({
          interactionId: id,
          value: {
            _meta: { permissionOutcome: { outcome: "selected", optionId } },
          },
        });
        const repeated = await app.request(permissionPath, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reply }),
        });
        expect(repeated.status).toBe(404);
      } finally {
        await provider.abortSession({ sessionId: nativeId }).catch(() => {});
        await sending;
        await events.return?.();
        env.close();
      }
    },
  );

  it("keeps unsupported UI replies and invalid direct options pending until an offered option is selected", async () => {
    const env = createPermissionApp("permissions-limited");
    const { app, provider, service } = env;
    const directory = process.cwd();
    const nativeId = `permission:${directory}`;
    const events = provider.subscribeEvents()[Symbol.asyncIterator]();
    let sending: Promise<InteractionResponse> | undefined;
    try {
      const session = await service.create({
        providerId: provider.id,
        directory,
      });
      sending = service.sendMessage(session.id, { content: "run command" });
      const approval = await nextApproval(events);
      const pending = await service.permissions(session.id);
      const answered = await app.request(
        `/api/sessions/${session.id}/permissions/${encodeURIComponent(approval.request.id)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reply: "always" }),
        },
      );
      expect(answered.status).toBe(400);
      expect(await answered.json()).toMatchObject({
        error: expect.stringContaining("not supported"),
      });
      for (const value of [
        "unoffered",
        { optionId: "unoffered" },
        { reply: "invalid" },
        null,
      ]) {
        await expect(
          provider.respondToInteraction({
            kind: "permission",
            sessionId: nativeId,
            interactionId: approval.request.id,
            value,
          }),
        ).rejects.toBeInstanceOf(ValidationError);
        expect(await service.permissions(session.id)).toEqual(pending);
      }
      expect(await service.hasPendingInteractions(session.id)).toBe(true);
      await provider.respondToInteraction({
        kind: "permission",
        sessionId: nativeId,
        interactionId: approval.request.id,
        value: "run-a7",
      });
      await expect(sending).resolves.toMatchObject({
        value: {
          _meta: {
            permissionOutcome: { outcome: "selected", optionId: "run-a7" },
          },
        },
      });
      expect(await service.permissions(session.id)).toEqual([]);
    } finally {
      await provider.abortSession({ sessionId: nativeId }).catch(() => {});
      await sending?.catch(() => {});
      await events.return?.();
      env.close();
    }
  });

  it("isolates directories and clears pending requests on abort and deletion", async () => {
    const env = createPermissionApp();
    const { provider, service } = env;
    const directories = [
      process.cwd(),
      fileURLToPath(new URL("../../", import.meta.url)),
    ];
    const events = provider.subscribeEvents()[Symbol.asyncIterator]();
    const sending: Array<Promise<unknown>> = [];
    try {
      const sessions: ChatSession[] = [];
      for (const directory of directories) {
        const session = await service.create({
          providerId: provider.id,
          directory,
        });
        sessions.push(session);
        sending.push(
          service
            .sendMessage(session.id, { content: "run command" })
            .catch((error: unknown) => error),
        );
        await nextApproval(events);
      }
      const [first, second] = sessions;
      if (!first || !second) throw new Error("Missing test sessions");
      const firstPending = await service.permissions(first.id);
      const secondPending = await service.permissions(second.id);
      expect(firstPending).toHaveLength(1);
      expect(secondPending).toHaveLength(1);
      expect(firstPending[0]?.sessionId).toBe(first.id);
      expect(secondPending[0]?.sessionId).toBe(second.id);
      expect(await provider.listPermissions!({})).toHaveLength(2);
      expect(
        await provider.listPermissions!({
          directory: "/not-a-session-directory",
        }),
      ).toEqual([]);
      await expect(
        provider.respondToInteraction({
          kind: "permission",
          sessionId: `permission:${directories[0]}`,
          interactionId: firstPending[0]!.id,
          directory: directories[1],
          value: { reply: "once" },
        }),
      ).rejects.toMatchObject({ status: 404 });
      expect(await service.permissions(first.id)).toEqual(firstPending);

      await service.abort(first.id);
      expect(await service.permissions(first.id)).toEqual([]);
      expect(await service.permissions(second.id)).toEqual(secondPending);
      await service.delete(second.id);
      expect(await provider.listPermissions!({})).toEqual([]);
      for (const prompt of sending)
        await expect(prompt).resolves.toMatchObject({ status: 409 });
    } finally {
      for (const directory of directories)
        await provider
          .abortSession({ sessionId: `permission:${directory}` })
          .catch(() => {});
      await Promise.all(sending);
      await events.return?.();
      env.close();
    }
  });
});
