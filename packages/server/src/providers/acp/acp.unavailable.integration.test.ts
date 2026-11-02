import { describe, expect, it } from "vitest";
import { createAgentProviderRegistry } from "../provider.registry";
import { createApp } from "../../server";
import { createTestApp } from "../../test-utils";
import { createSessionsRepository } from "../../features/sessions/sessions.repository";
import { createSessionsService } from "../../features/sessions/sessions.service";
import { createAcpAdapter } from "./acp.adapter";

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
  .onRequest(acp.methods.agent.session.new, () => {
    opened = true;
    return { sessionId: "original" };
  })
  .onRequest(acp.methods.agent.session.load, () => { throw new Error("load failed"); })
  .onRequest(acp.methods.agent.session.resume, () => { opened = true; return {}; })
  .onRequest(acp.methods.agent.session.prompt, () => {
    if (!opened && profile !== "direct") throw new Error("session not found");
    return { stopReason: "end_turn" };
  });
server.connect(acp.ndJsonStream(Writable.toWeb(process.stdout), Readable.toWeb(process.stdin)));
`;

function adapter(profile: string) {
  return createAcpAdapter({
    id: "acp-test",
    name: "Test agent",
    launch: { command: process.execPath, args: ["--input-type=module", "--eval", agent, profile] },
    timeoutMs: 2000,
  });
}

describe("unavailable ACP sessions", () => {
  it("retains the binding and exposes an empty unavailable history and send error through the session API", async () => {
    const env = createTestApp();
    const provider = adapter("unavailable");
    const registry = createAgentProviderRegistry({ providers: [provider] });
    env.container.agentProviderRegistry = registry;
    env.container.sessionsService = createSessionsService(createSessionsRepository(env.db.db), registry);
    const app = createApp({ container: env.container });
    try {
      const created = await app.request("/api/sessions", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ providerId: "acp-test", directory: process.cwd() }),
      });
      expect(created.status).toBe(201);
      const { id } = await created.json();
      await provider.abortSession({ sessionId: "original" });
      const history = await app.request(`/api/sessions/${id}/messages`);
      expect(await history.json()).toMatchObject({ messages: [], historyUnavailable: true });
      const sent = await app.request(`/api/sessions/${id}/messages`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "unsent draft" }),
      });
      expect(sent.status).toBe(409);
      expect(await sent.json()).toMatchObject({ error: expect.stringContaining("original session") });
      const listed = await app.request("/api/sessions");
      expect(await listed.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id })]));
    } finally {
      env.close();
    }
  });

  it.each(["resume", "direct"])("can continue with %s even without history", async (profile) => {
    const provider = adapter(profile);
    await provider.createSession({ directory: process.cwd() });
    await provider.abortSession({ sessionId: "original" });
    expect(await provider.listMessages!({ sessionId: "original", directory: process.cwd() })).toMatchObject({
      messages: [], historyUnavailable: true,
    });
    await expect(provider.sendMessage({ sessionId: "original", content: "hello" })).resolves.toBeDefined();
    await provider.abortSession({ sessionId: "original" });
  });

  it("treats an advertised but failing history load as unavailable", async () => {
    const provider = adapter("failed-load");
    await provider.createSession({ directory: process.cwd() });
    await provider.abortSession({ sessionId: "original" });
    expect(await provider.listMessages!({ sessionId: "original", directory: process.cwd() })).toMatchObject({
      messages: [], historyUnavailable: true,
    });
    await provider.abortSession({ sessionId: "original" });
  });
});
