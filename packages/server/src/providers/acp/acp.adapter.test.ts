import { spawn } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { createAcpAdapter } from "./acp.adapter";

const fakeAgent = `
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";

const profile = process.argv.at(-1);
let cancelled = () => {};
let loadCount = 0;
const agent = acp.agent({ name: "fake-agent" })
  .onRequest(acp.methods.agent.initialize, () => ({
    protocolVersion: acp.PROTOCOL_VERSION,
    agentInfo: { name: profile, version: "1.0.0" },
    agentCapabilities: { loadSession: profile === "replay", sessionCapabilities: { close: true, delete: true } },
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
  .onRequest(acp.methods.agent.session.load, async ({ params, client }) => {
    if (profile !== "replay") throw new Error("load not supported");
    const emit = (update) => client.notify(acp.methods.client.session.update, { sessionId: params.sessionId, update });
    await emit({ sessionUpdate: "user_message_chunk", messageId: "user-1", content: { type: "text", text: "hello" } });
    await emit({ sessionUpdate: "agent_thought_chunk", messageId: "assistant-1", content: { type: "text", text: "thinking" } });
    await emit({ sessionUpdate: "tool_call", toolCallId: "tool-1", name: "read", title: "Read file", kind: "read", status: "completed" });
    await emit({ sessionUpdate: "agent_message_chunk", messageId: "assistant-1", content: { type: "text", text: "from agent " + ++loadCount } });
    return {};
  })
  .onRequest(acp.methods.agent.session.prompt, async ({ params, client }) => {
    if (profile === "events") {
      const emit = (update) => client.notify(acp.methods.client.session.update, { sessionId: params.sessionId, update });
      await emit({ sessionUpdate: "agent_thought_chunk", messageId: "thought-1", content: { type: "text", text: "considering" } });
      await emit({ sessionUpdate: "tool_call", toolCallId: "tool-1", name: "edit", title: "Edit app", kind: "edit", status: "pending", rawInput: { path: "app.ts" } });
      await emit({ sessionUpdate: "tool_call_update", toolCallId: "tool-1", status: "in_progress", content: [{ type: "content", content: { type: "text", text: "editing" } }] });
      await emit({ sessionUpdate: "tool_call_update", toolCallId: "tool-1", status: "completed", content: [{ type: "diff", path: "app.ts", oldText: "old", newText: "new" }], rawOutput: { done: true } });
      await emit({ sessionUpdate: "plan", entries: [{ content: "Edit app", priority: "medium", status: "completed" }] });
      if (params.prompt[0].text === "again") await emit({ sessionUpdate: "plan", entries: [] });
      await emit({ sessionUpdate: "session_info_update", title: "Updated title" });
      await emit({ sessionUpdate: "config_option_update", configOptions: [{ id: "model", name: "Model", type: "select", currentValue: "model-2", options: [{ value: "model-2", name: "Model Two" }] }] });
      await emit({ sessionUpdate: "agent_message_chunk", messageId: "thought-1", content: { type: "text", text: "Done." } });
      await emit({ sessionUpdate: "agent_message_chunk", messageId: "answer-2", content: { type: "image", data: "aGVsbG8=", mimeType: "image/png" } });
      return { stopReason: "end_turn", usage: { totalTokens: 19, inputTokens: 12, outputTokens: 7, cachedReadTokens: 3 } };
    }
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
    return { stopReason: profile === "cancelled" ? "cancelled" : "end_turn" };
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
  it("loads the full message history from ACP and can reopen a session after the process exits", async () => {
    const adapter = createAdapter("replay");
    const directory = process.cwd();
    await adapter.createSession({ directory });
    const first = await adapter.listMessages?.({
      sessionId: "replay-session",
      directory,
    });
    expect(first).toMatchObject({
      messages: [
        { role: "user", parts: [{ type: "text", text: "hello" }] },
        {
          role: "assistant",
          parts: [
            { type: "reasoning", text: "thinking" },
            { type: "tool", toolName: "read" },
            { type: "text", text: "from agent 1" },
          ],
        },
      ],
    });
    expect(first?.nextCursor).toBeUndefined();
    const refreshed = await adapter.listMessages?.({
      sessionId: "replay-session",
      directory,
    });
    expect(refreshed?.messages[1]?.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "text", text: "from agent 2" }),
      ]),
    );
    await adapter.abortSession({ sessionId: "replay-session" });
    const reopened = await adapter.listMessages?.({
      sessionId: "replay-session",
      directory,
    });
    expect(
      reopened?.messages.map((message) => ({
        role: message.role,
        parts: message.parts.map((part) => part.type),
      })),
    ).toEqual(
      first?.messages.map((message) => ({
        role: message.role,
        parts: message.parts.map((part) => part.type),
      })),
    );
    await adapter.deleteSession({ sessionId: "replay-session" });
  });

  it("maps ACP thinking, tool progress, diff, plan, title, and message identities", async () => {
    const adapter = createAdapter("events");
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    await adapter.createSession({ directory: process.cwd() });
    await adapter.sendMessage({
      sessionId: "events-session",
      directory: process.cwd(),
      content: "go",
      turnId: "turn-1",
    });

    const received = [];
    while (true) {
      const next = await events.next();
      if (next.done) break;
      received.push(next.value);
      if (
        next.value.type === "session.status" &&
        next.value.runStatus === "completed"
      )
        break;
    }
    expect(received).toContainEqual(
      expect.objectContaining({
        type: "session.title.updated",
        title: "Updated title",
      }),
    );
    expect(received).toContainEqual(
      expect.objectContaining({
        type: "message.delta",
        delta: "Done.",
      }),
    );
    expect(received).toContainEqual(
      expect.objectContaining({
        type: "message.part.updated",
        part: expect.objectContaining({
          type: "tool",
          toolName: "edit",
          status: "running",
          output: [
            { type: "content", content: { type: "text", text: "editing" } },
          ],
        }),
      }),
    );
    const page = await adapter.listMessages?.({ sessionId: "events-session" });
    const assistants =
      page?.messages.filter((message) => message.role === "assistant") ?? [];
    expect(assistants).toHaveLength(1);
    expect(assistants[0]?.id).toBe("acp:events-session:turn-1");
    expect(assistants[0]?.parts.map((part) => part.type)).toEqual([
      "reasoning",
      "tool",
      "diff",
      "tool",
      "text",
      "unknown",
      "step-finish",
    ]);
    expect(assistants[0]?.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "reasoning", text: "considering" }),
        expect.objectContaining({ type: "text", text: "Done." }),
        expect.objectContaining({
          type: "tool",
          callId: "tool-1",
          toolName: "edit",
          status: "completed",
          input: { path: "app.ts" },
          output: { done: true },
        }),
        expect.objectContaining({
          type: "diff",
          path: "app.ts",
          before: "old",
          after: "new",
        }),
        expect.objectContaining({
          type: "tool",
          toolName: "todowrite",
          input: {
            content: "Todo",
            todos: [
              { content: "Edit app", priority: "medium", status: "completed" },
            ],
          },
        }),
      ]),
    );
    expect(assistants[0]?.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "unknown",
          providerType: "image",
          data: {
            sessionUpdate: "agent_message_chunk",
            messageId: "answer-2",
            content: { type: "image", data: "aGVsbG8=", mimeType: "image/png" },
          },
        }),
        expect.objectContaining({
          type: "step-finish",
          reason: "stop",
          modelID: "model-2",
          tokens: {
            input: 12,
            output: 7,
            reasoning: 0,
            cache: { read: 3, write: 0 },
          },
          metadata: expect.objectContaining({
            provider: "acp",
            stopReason: "end_turn",
          }),
        }),
      ]),
    );
    expect(
      received.filter((event) => event.type === "message.part.updated"),
    ).toHaveLength(9);
    const finishIndex = received.findIndex(
      (event) =>
        event.type === "message.part.updated" &&
        event.part.type === "step-finish",
    );
    expect(finishIndex).toBeGreaterThan(0);
    expect(received[finishIndex + 1]).toMatchObject({
      type: "session.status",
      runStatus: "completed",
    });
    await adapter.sendMessage({
      sessionId: "events-session",
      directory: process.cwd(),
      content: "again",
      turnId: "turn-2",
    });
    const nextPage = await adapter.listMessages?.({
      sessionId: "events-session",
    });
    const nextAssistants =
      nextPage?.messages.filter((message) => message.role === "assistant") ??
      [];
    expect(nextAssistants).toHaveLength(2);
    expect(nextAssistants[1]?.id).toBe("acp:events-session:turn-2");
    expect(nextAssistants[1]?.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "reasoning", text: "considering" }),
        expect.objectContaining({ type: "text", text: "Done." }),
        expect.objectContaining({
          type: "tool",
          toolName: "todowrite",
          input: { content: "No todos", todos: [] },
        }),
      ]),
    );
    await adapter.deleteSession({ sessionId: "events-session" });
    await events.return?.();
  });

  it("initializes distinct agents, creates sessions with absolute cwd, and streams prompt updates", async () => {
    const alpha = createAdapter("alpha");
    const beta = createAdapter("beta");
    const alphaEvents = alpha.subscribeEvents()[Symbol.asyncIterator]();
    const betaEvents = beta.subscribeEvents()[Symbol.asyncIterator]();

    await expect(alpha.getInfo()).resolves.toMatchObject({
      agents: [{ id: "fake-alpha", name: "Fake alpha", mode: "primary" }],
      capabilities: {
        agents: true,
        models: false,
        tools: true,
        reasoning: true,
      },
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
      value: {
        type: "message.part.updated",
        part: { type: "text", text: "alpha:hello" },
      },
    });
    await expect(alphaEvents.next()).resolves.toMatchObject({
      value: { type: "message.delta", delta: "alpha:hello" },
    });
    await expect(prompt).resolves.toMatchObject({
      interactionId: "alpha-session",
    });
    await expect(alphaEvents.next()).resolves.toMatchObject({
      value: {
        type: "message.part.updated",
        part: {
          type: "step-finish",
          reason: "stop",
          modelID: "model-1",
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
        },
      },
    });
    await expect(alphaEvents.next()).resolves.toMatchObject({
      value: { type: "session.status", runStatus: "completed" },
    });
    await expect(
      alpha.listMessages?.({ sessionId: "alpha-session" }),
    ).resolves.toMatchObject({
      messages: [
        { role: "user", parts: [{ text: "hello" }] },
        {
          role: "assistant",
          parts: [
            { text: "alpha:hello" },
            { type: "step-finish", reason: "stop" },
          ],
        },
      ],
    });
    await alpha.deleteSession({ sessionId: "alpha-session" });
    await beta.deleteSession({ sessionId: "beta-session" });
    await expect(betaEvents.return?.()).resolves.toMatchObject({ done: true });
    await expect(alphaEvents.return?.()).resolves.toMatchObject({ done: true });
  });

  it("records a cancelled prompt as a step finish without inventing usage", async () => {
    const adapter = createAdapter("cancelled");
    await adapter.createSession({ directory: process.cwd() });
    await adapter.sendMessage({
      sessionId: "cancelled-session",
      directory: process.cwd(),
      content: "stop",
    });
    await expect(
      adapter.listMessages?.({ sessionId: "cancelled-session" }),
    ).resolves.toMatchObject({
      messages: [
        { role: "user" },
        {
          role: "assistant",
          parts: [
            { type: "text" },
            {
              type: "step-finish",
              reason: "cancelled",
              cost: 0,
              metadata: { provider: "acp", stopReason: "cancelled" },
            },
          ],
        },
      ],
    });
    await adapter.deleteSession({ sessionId: "cancelled-session" });
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
