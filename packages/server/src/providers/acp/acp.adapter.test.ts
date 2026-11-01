import { spawn } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { createAcpAdapter } from "./acp.adapter";

const fakeAgent = `
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";

const profile = process.argv.at(-1);
let cancelled = () => {};
const agent = acp.agent({ name: "fake-agent" })
  .onRequest(acp.methods.agent.initialize, () => ({
    protocolVersion: acp.PROTOCOL_VERSION,
    agentInfo: { name: profile, version: "1.0.0" },
    agentCapabilities: { sessionCapabilities: { close: true, delete: true } },
  }))
  .onRequest(acp.methods.agent.session.new, ({ params }) => {
    if (!params.cwd.startsWith("/")) throw new Error("cwd must be absolute");
    if (profile === "dies") process.exit(1);
    return {
      sessionId: profile + "-session",
      configOptions: [{
        id: "model",
        name: "Model",
        category: "model",
        type: "select",
        currentValue: "model-1",
        options: [{ value: "model-1", name: "Model One" }],
      }],
    };
  })
  .onRequest(acp.methods.agent.session.delete, () => ({}))
  .onRequest(acp.methods.agent.session.close, () => ({}))
  .onRequest(acp.methods.agent.session.prompt, async ({ params, client }) => {
    await client.notify(acp.methods.client.session.update, {
      sessionId: params.sessionId,
      update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: profile + ":" + params.prompt[0].text } },
    });
    if (params.prompt[0].text === "permission") {
      await client.request(acp.methods.client.session.requestPermission, {
        sessionId: params.sessionId,
        toolCall: { toolCallId: "tool-1", title: "Run command" },
        options: [{ optionId: "allow", name: "Allow", kind: "allow_once" }],
      });
    }
    if (params.prompt[0].text === "wait")
      await new Promise((resolve) => { cancelled = resolve; });
    return { stopReason: "end_turn" };
  })
  .onNotification(acp.methods.agent.session.cancel, () => cancelled());

agent.connect(acp.ndJsonStream(
  Writable.toWeb(process.stdout),
  Readable.toWeb(process.stdin),
));
`;

function createAdapter(profile: string) {
  return createAcpAdapter({
    id: `fake-${profile}`,
    name: `Fake ${profile}`,
    launch: {
      command: process.execPath,
      args: ["--input-type=module", "--eval", fakeAgent, profile],
    },
    timeoutMs: 500,
  });
}

describe("createAcpAdapter", () => {
  it("initializes distinct agents, creates sessions with absolute cwd, and streams prompt updates", async () => {
    const alpha = createAdapter("alpha");
    const beta = createAdapter("beta");
    const alphaEvents = alpha.subscribeEvents()[Symbol.asyncIterator]();
    const betaEvents = beta.subscribeEvents()[Symbol.asyncIterator]();

    await expect(alpha.getInfo()).resolves.toMatchObject({
      agents: [{ id: "fake-alpha", name: "Fake alpha", mode: "primary" }],
      capabilities: { agents: true, models: false },
    });

    await expect(
      alpha.createSession({ directory: process.cwd(), title: "Alpha" }),
    ).resolves.toMatchObject({ id: "alpha-session", directory: process.cwd() });
    await expect(
      beta.createSession({ directory: process.cwd() }),
    ).resolves.toMatchObject({
      id: "beta-session",
    });
    await expect(alpha.getInfo()).resolves.toMatchObject({
      capabilities: { models: true },
      models: [
        { providerId: "fake-alpha", modelId: "model-1", name: "Model One" },
      ],
    });
    await expect(
      alpha.createSession({ directory: "relative" }),
    ).rejects.toThrow("absolute directory");

    const prompt = alpha.sendMessage({
      sessionId: "alpha-session",
      directory: process.cwd(),
      content: "hello",
    });
    await expect(alphaEvents.next()).resolves.toMatchObject({
      value: { type: "message.updated", message: { role: "user" } },
    });
    await expect(alphaEvents.next()).resolves.toMatchObject({
      value: { type: "message.updated", message: { role: "assistant" } },
    });
    await expect(alphaEvents.next()).resolves.toMatchObject({
      value: { type: "session.status", runStatus: "running" },
    });
    await expect(alphaEvents.next()).resolves.toMatchObject({
      value: { type: "message.delta", delta: "alpha:hello" },
    });
    await expect(prompt).resolves.toMatchObject({
      interactionId: "alpha-session",
    });
    await expect(alphaEvents.next()).resolves.toMatchObject({
      value: { type: "session.status", runStatus: "completed" },
    });
    await expect(
      alpha.listMessages?.({ sessionId: "alpha-session" }),
    ).resolves.toMatchObject({
      messages: [
        { role: "user", parts: [{ text: "hello" }] },
        { role: "assistant", parts: [{ text: "alpha:hello" }] },
      ],
    });
    await alpha.deleteSession({ sessionId: "alpha-session" });
    await beta.deleteSession({ sessionId: "beta-session" });
    await expect(betaEvents.return?.()).resolves.toMatchObject({ done: true });
    await expect(alphaEvents.return?.()).resolves.toMatchObject({ done: true });
  });

  it("discovers catalog models through a temporary ACP session", async () => {
    const adapter = createAcpAdapter({
      id: "catalog",
      name: "Catalog",
      launch: {
        command: process.execPath,
        args: ["--input-type=module", "--eval", fakeAgent, "catalog"],
      },
      catalogDirectory: process.cwd(),
    });

    await expect(adapter.getInfo()).resolves.toMatchObject({
      capabilities: { agents: true, models: true },
      agents: [{ id: "catalog", name: "Catalog" }],
      models: [
        { providerId: "catalog", modelId: "model-1", name: "Model One" },
      ],
    });
    await expect(adapter.getInfo()).resolves.toMatchObject({
      models: [{ modelId: "model-1" }],
    });
  });

  it("replies to pending permissions, cancels sessions, and releases the child process", async () => {
    const adapter = createAdapter("permission");
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    await adapter.createSession({ directory: process.cwd() });

    const prompt = adapter.sendMessage({
      sessionId: "permission-session",
      directory: process.cwd(),
      content: "permission",
    });
    await events.next();
    await events.next();
    await events.next();
    await events.next();
    const permission = await events.next();
    expect(permission.value).toMatchObject({
      type: "approval.requested",
      request: { id: "permission-session:tool-1" },
    });
    await adapter.respondToInteraction({
      kind: "permission",
      sessionId: "permission-session",
      interactionId: "permission-session:tool-1",
      value: { optionId: "allow" },
    });
    await expect(prompt).resolves.toMatchObject({
      interactionId: "permission-session",
    });

    const waiting = adapter.sendMessage({
      sessionId: "permission-session",
      directory: process.cwd(),
      content: "wait",
    });
    await events.next();
    await events.next();
    await adapter.abortSession({ sessionId: "permission-session" });
    await expect(waiting).rejects.toThrow();
    await expect(
      adapter.sendMessage({
        sessionId: "permission-session",
        directory: process.cwd(),
        content: "again",
      }),
    ).rejects.toThrow("ACP session not found");
    await events.return?.();
  });

  it("rejects initialization when the agent process dies", async () => {
    const adapter = createAdapter("dies");
    await expect(
      adapter.createSession({ directory: process.cwd() }),
    ).rejects.toThrow(/ACP agent exited|connection/i);
  });

  it("uses an injected spawn implementation", async () => {
    const spy = vi.fn(spawn);
    const adapter = createAcpAdapter({
      id: "spawned",
      name: "Spawned",
      launch: {
        command: process.execPath,
        args: ["--input-type=module", "--eval", fakeAgent, "injected"],
      },
      spawn: spy,
    });
    await adapter.createSession({ directory: process.cwd() });
    expect(spy).toHaveBeenCalledWith(
      process.execPath,
      expect.arrayContaining(["--input-type=module"]),
      expect.objectContaining({ stdio: ["pipe", "pipe", "pipe"] }),
    );
    await adapter.deleteSession({ sessionId: "injected-session" });
  });
});
