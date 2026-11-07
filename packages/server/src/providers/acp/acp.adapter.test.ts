import { spawn } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { createAcpAdapter } from "./acp.adapter";
import { applyChatEvent } from "../../../../../apps/web-app/src/lib/streaming/message-stream";
import type { MessageStreamState } from "../../../../../apps/web-app/src/lib/streaming/message-stream";

const fakeAgent = `
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";

const profile = process.argv.at(-1);
let cancelled = () => {};
let loadCount = 0;
let restored = false;
let activeModel = "model-1";
const modelOption = () => ({
  id: profile.startsWith("models") ? "engine" : "model",
  name: "Model",
  category: "model",
  type: "select",
  currentValue: activeModel,
  options: profile.startsWith("models")
    ? [{ name: "Available", group: "models", options: [{ value: "model-1", name: "Model One" }, { value: "model-2", name: "Model Two" }] }]
    : [{ value: "model-1", name: "Model One" }],
});
const waitForRestore = async (params, client) => {
  await client.request(acp.methods.client.session.requestPermission, {
    sessionId: params.sessionId,
    toolCall: { toolCallId: "restore", title: "Restore" },
    options: [{ optionId: "allow", name: "Allow", kind: "allow_once" }],
  });
  restored = true;
};
const genericTrace = async (emit) => {
  await emit({ sessionUpdate: "tool_call_update", toolCallId: "a", rawOutput: { progress: 1 } });
  await emit({ sessionUpdate: "tool_call", toolCallId: "b", title: "Write report", kind: "edit", status: "pending", locations: [{ path: "report.txt", line: 4 }] });
  await emit({ sessionUpdate: "tool_call_update", toolCallId: "a", name: "provider.custom", title: "Working", kind: "other", status: "pending", rawInput: { query: "x" } });
  await emit({ sessionUpdate: "tool_call_update", toolCallId: "a", status: "in_progress", content: [{ type: "content", content: { type: "text", text: "working" } }], rawOutput: { count: 2 } });
  await emit({ sessionUpdate: "tool_call_update", toolCallId: "b", status: "failed", content: [{ type: "content", content: { type: "text", text: "permission denied" } }] });
  await emit({ sessionUpdate: "tool_call_update", toolCallId: "a", status: "completed", content: [{ type: "terminal", terminalId: "term-1" }, { type: "content", content: { type: "text", text: "done" } }], rawOutput: { count: 3 } });
  await emit({ sessionUpdate: "tool_call_update", toolCallId: "a", content: [], locations: [], rawOutput: null });
};
const otherToolsTrace = async (emit) => {
  const calls = [
    ["read", { filePath: "src/a.ts", offset: 5, limit: 9 }],
    ["grep", { pattern: "needle", path: "src", include: "*.ts" }],
    ["glob", { pattern: "**/*.ts", path: "src" }],
    ["webfetch", { url: "https://example.org", format: "markdown", timeout: 30 }],
    ["websearch", { query: "cloudy", numResults: 3 }],
    ["task", { agent: "reviewer", description: "Review code", prompt: "Find defects", sessionId: "child-1" }],
    ["question", { questions: [{ question: "Choose?", header: "Choice", options: [{ label: "A", description: "First" }] }] }],
    ["todowrite", { todos: [{ content: "Start", status: "in_progress" }, { content: "Later", status: "pending" }] }],
  ];
  for (const [name, input] of calls) {
    await emit({ sessionUpdate: "tool_call", toolCallId: name, title: name, status: "pending" });
    await emit({ sessionUpdate: "tool_call_update", toolCallId: name, name, rawInput: input, status: "in_progress" });
    await emit({ sessionUpdate: "tool_call_update", toolCallId: name, status: "completed", rawOutput: { result: name } });
  }
  await emit({ sessionUpdate: "tool_call", toolCallId: "partial", name: "read", title: "Read", rawInput: { offset: 2 }, status: "pending" });
  await emit({ sessionUpdate: "tool_call", toolCallId: "ambiguous", title: "websearch", kind: "search", rawInput: { query: "cloudy" }, status: "failed" });
  await emit({ sessionUpdate: "tool_call_update", toolCallId: "partial", rawInput: { filePath: "late.txt" }, status: "failed", content: [{ type: "content", content: { type: "text", text: "not found" } }] });
};
const agent = acp.agent({ name: "fake-agent" })
  .onRequest(acp.methods.agent.initialize, () => ({
    protocolVersion: acp.PROTOCOL_VERSION,
    agentInfo: { name: profile, version: "1.0.0" },
    agentCapabilities: { loadSession: ["other-tools", "generic", "replay", "replay-conversation", "no-user", "delayed-load", "reload-failure", "models-load"].includes(profile), sessionCapabilities: { close: true, delete: true, ...(["resume", "delayed-resume", "models-resume", "permission"].includes(profile) ? { resume: {} } : {}) } },
  }))
  .onRequest(acp.methods.agent.session.new, ({ params }) => {
    if (!params.cwd.startsWith("/")) throw new Error("cwd must be absolute");
    if (profile === "dies") process.exit(1);
    return {
      sessionId: profile + "-session",
      configOptions: [modelOption()],
    };
  })
  .onRequest(acp.methods.agent.session.delete, () => ({}))
  .onRequest(acp.methods.agent.session.close, () => ({}))
  .onRequest(acp.methods.agent.session.load, async ({ params, client }) => {
    const emit = (update) => client.notify(acp.methods.client.session.update, { sessionId: params.sessionId, update });
    if (profile === "other-tools") {
      await emit({ sessionUpdate: "user_message_chunk", content: { type: "text", text: "go" } });
      await otherToolsTrace(emit);
      return {};
    }
    if (profile === "generic") {
      await emit({ sessionUpdate: "user_message_chunk", content: { type: "text", text: "go" } });
      await genericTrace(emit);
      return {};
    }
    if (profile === "models-load") return { configOptions: [modelOption()] };
    if (profile === "delayed-load") {
      await waitForRestore(params, client);
      return { configOptions: [modelOption()] };
    }
    if (profile === "reload-failure") {
      await emit({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "partial replay" } });
      throw new Error("transient history error");
    }
    if (profile === "no-user") {
      await emit({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "Only answer" } });
      return {};
    }
    if (profile === "replay-conversation") {
      const generation = ++loadCount;
      const user = (text, turn) => emit({ sessionUpdate: "user_message_chunk", messageId: "user-" + generation + "-" + turn, content: { type: "text", text } });
      const text = (text, turn) => emit({ sessionUpdate: "agent_message_chunk", messageId: "answer-" + generation + "-" + turn, content: { type: "text", text } });
      const a = "a-" + generation;
      const b = "b-" + generation;
      await user("fir", 1);
      await user("st", 1);
      await text("Hello", 1);
      await emit({ sessionUpdate: "tool_call_update", toolCallId: a, rawOutput: { progress: 1 } });
      await emit({ sessionUpdate: "tool_call", toolCallId: b, name: "write", title: "Write", status: "pending" });
      await emit({ sessionUpdate: "tool_call_update", toolCallId: a, status: "in_progress" });
      await emit({ sessionUpdate: "tool_call_update", toolCallId: b, status: "completed", rawOutput: { done: "b" } });
      await emit({ sessionUpdate: "tool_call", toolCallId: a, name: "read", title: "Read", status: "completed", rawInput: { filePath: "a.txt" }, rawOutput: { done: "a" } });
      await text(" world", 1);
      await user("second", 2);
      await text("Next", 2);
      await emit({ sessionUpdate: "tool_call_update", toolCallId: a, rawOutput: { delayed: true } });
      await text(" turn", 2);
      return {};
    }
    if (profile !== "replay") throw new Error("load not supported");
    await emit({ sessionUpdate: "user_message_chunk", messageId: "user-1", content: { type: "text", text: "hello" } });
    await emit({ sessionUpdate: "agent_thought_chunk", messageId: "assistant-1", content: { type: "text", text: "thinking" } });
    await emit({ sessionUpdate: "tool_call", toolCallId: "tool-1", name: "read", title: "Read file", kind: "read", status: "completed", rawInput: { filePath: "a.txt" } });
    await emit({ sessionUpdate: "agent_message_chunk", messageId: "assistant-1", content: { type: "text", text: "from agent " + ++loadCount } });
    return {};
  })
  .onRequest(acp.methods.agent.session.resume, async ({ params, client }) => {
    if (profile === "delayed-resume") await waitForRestore(params, client);
    else restored = true;
    return { configOptions: [modelOption()] };
  })
  .onRequest(acp.methods.agent.session.prompt, async ({ params, client }) => {
    if (["delayed-load", "delayed-resume"].includes(profile) && !restored) throw new Error("session not restored");
    if (profile.startsWith("models")) {
      const answerModel = activeModel;
      if (params.prompt[0].text === "permission") {
        await client.request(acp.methods.client.session.requestPermission, {
          sessionId: params.sessionId,
          toolCall: { toolCallId: "model-wait", title: "Continue" },
          options: [{ optionId: "allow", name: "Allow", kind: "allow_once" }],
        });
      }
      await client.notify(acp.methods.client.session.update, {
        sessionId: params.sessionId,
        update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: answerModel + ":" + params.prompt[0].text } },
      });
      if (profile === "models-update" && params.prompt[0].text === "update") {
        activeModel = "model-2";
        await client.notify(acp.methods.client.session.update, {
          sessionId: params.sessionId,
          update: { sessionUpdate: "config_option_update", configOptions: [modelOption()] },
        });
      }
      return { stopReason: "end_turn" };
    }
    if (profile === "other-tools") {
      const emit = (update) => client.notify(acp.methods.client.session.update, { sessionId: params.sessionId, update });
      await otherToolsTrace(emit);
      return { stopReason: "end_turn" };
    }
    if (profile === "generic") {
      const emit = (update) => client.notify(acp.methods.client.session.update, { sessionId: params.sessionId, update });
      await genericTrace(emit);
      return { stopReason: "end_turn" };
    }
    if (profile === "conversation" || profile === "replay-conversation") {
      const emit = (update) => client.notify(acp.methods.client.session.update, { sessionId: params.sessionId, update });
      const text = (text) => emit({ sessionUpdate: "agent_message_chunk", content: { type: "text", text } });
      if (params.prompt[0].text === "first") {
        await text("Hel");
        await text("lo");
        await emit({ sessionUpdate: "tool_call_update", toolCallId: "a", rawOutput: { progress: 1 } });
        await emit({ sessionUpdate: "tool_call", toolCallId: "b", name: "write", title: "Write", status: "pending" });
        await emit({ sessionUpdate: "tool_call_update", toolCallId: "a", status: "in_progress" });
        await emit({ sessionUpdate: "tool_call_update", toolCallId: "b", status: "completed", rawOutput: { done: "b" } });
        await emit({ sessionUpdate: "tool_call", toolCallId: "a", name: "read", title: "Read", status: "completed", rawInput: { filePath: "a.txt" }, rawOutput: { done: "a" } });
        await text(" wor");
        await text("ld");
      } else {
        await text("Next");
        await emit({ sessionUpdate: "tool_call_update", toolCallId: "a", rawOutput: { delayed: true } });
        await text(" turn");
      }
      return { stopReason: "end_turn" };
    }
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

if (profile !== "models-unsupported") {
  agent.onRequest(acp.methods.agent.session.setConfigOption, ({ params }) => {
    if (profile === "models-reject") throw new Error("model change rejected");
    if (params.configId !== modelOption().id) throw new Error("wrong configuration option");
    if (profile !== "models-unconfirmed") activeModel = params.value;
    return { configOptions: profile === "models-unconfirmed" ? [] : [modelOption()] };
  });
}

agent.connect(acp.ndJsonStream(
  Writable.toWeb(process.stdout),
  Readable.toWeb(process.stdin),
));
`;

const selectedModel = { providerId: "fake", modelId: "model-1" };

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
  it("uses the selected session model on each turn and records confirmed model metadata", async () => {
    const adapter = createAdapter("models");
    const directory = process.cwd();
    const sessionId = "models-session";
    await adapter.createSession({ directory });
    try {
      for (const [content, modelId] of [["first", "model-2"], ["second", "model-1"]]) {
        await adapter.sendMessage({
          sessionId,
          directory,
          content: content!,
          model: { providerId: "fake-models", modelId: modelId! },
        });
      }
      const history = await adapter.listMessages!({ sessionId });
      expect(history.messages).toMatchObject([
        { role: "user", parts: [{ text: "first" }] },
        { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-2:first" }), expect.objectContaining({ type: "step-finish", modelID: "model-2" })]) },
        { role: "user", parts: [{ text: "second" }] },
        { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-1:second" }), expect.objectContaining({ type: "step-finish", modelID: "model-1" })]) },
      ]);
    } finally {
      await adapter.deleteSession({ sessionId });
    }
  });

  it.each(["models-reject", "models-unsupported"])(
    "allows an already active model when %s cannot change it",
    async (profile) => {
      const adapter = createAdapter(profile);
      const sessionId = `${profile}-session`;
      await adapter.createSession({ directory: process.cwd() });
      try {
        await adapter.sendMessage({ sessionId, content: "hello", model: selectedModel });
        expect((await adapter.listMessages!({ sessionId })).messages).toMatchObject([
          { role: "user" },
          { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-1:hello" })]) },
        ]);
      } finally {
        await adapter.deleteSession({ sessionId });
      }
    },
  );

  it.each([
    { profile: "models", modelId: undefined, message: "Select a model" },
    { profile: "models", modelId: "missing", message: "not available" },
    { profile: "models-reject", modelId: "model-2", message: "could not activate" },
    { profile: "models-unsupported", modelId: "model-2", message: "could not activate" },
    { profile: "models-unconfirmed", modelId: "model-2", message: "did not confirm" },
  ])("does not deliver a prompt when model selection fails: $message", async ({ profile, modelId, message }) => {
    const adapter = createAdapter(profile);
    const sessionId = `${profile}-session`;
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    await adapter.createSession({ directory: process.cwd() });
    try {
      await expect(adapter.sendMessage({
        sessionId,
        content: "must not be delivered",
        model: modelId ? { providerId: "fake", modelId } : undefined,
      })).rejects.toThrow(message);
      if (profile === "models-unconfirmed") {
        await adapter.deleteSession({ sessionId });
        await adapter.createSession({ directory: process.cwd() });
      }
      await adapter.sendMessage({ sessionId, content: "retry", model: selectedModel });
      expect((await events.next()).value).toMatchObject({
        type: "message.updated",
        message: { role: "user", parts: [{ text: "retry" }] },
      });
      expect((await adapter.listMessages!({ sessionId })).messages).toMatchObject([
        { role: "user", parts: [{ text: "retry" }] },
        { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-1:retry" })]) },
      ]);
    } finally {
      await adapter.deleteSession({ sessionId });
      await events.return?.();
    }
  });

  it.each(["models-reject", "models-unsupported"])(
    "preserves a live non-resumable session after %s rejects a model change",
    async (profile) => {
      const adapter = createAdapter(profile);
      const sessionId = `${profile}-session`;
      await adapter.createSession({ directory: process.cwd() });
      try {
        await adapter.sendMessage({ sessionId, content: "before", model: selectedModel });
        await expect(adapter.sendMessage({
          sessionId,
          content: "not delivered",
          model: { providerId: "fake", modelId: "model-2" },
        })).rejects.toThrow("could not activate");
        await adapter.sendMessage({ sessionId, content: "retry", model: selectedModel });
        expect((await adapter.listMessages!({ sessionId })).messages).toMatchObject([
          { role: "user", parts: expect.arrayContaining([expect.objectContaining({ text: "before" })]) },
          { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-1:before" })]) },
          { role: "user", parts: expect.arrayContaining([expect.objectContaining({ text: "retry" })]) },
          { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-1:retry" })]) },
        ]);
      } finally {
        await adapter.deleteSession({ sessionId });
      }
    },
  );

  it.each(["models-load", "models-resume"])(
    "applies the selection to a restored %s session",
    async (profile) => {
      const adapter = createAdapter(profile);
      const sessionId = `${profile}-session`;
      const directory = process.cwd();
      const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
      await adapter.createSession({ sessionId, directory });
      try {
        await adapter.sendMessage({ sessionId, directory, content: "restored", model: { providerId: "fake", modelId: "model-2" } });
        let answer;
        while (true) {
          const event = await events.next();
          if (event.done) throw new Error("Event stream closed before response");
          if (event.value.type === "message.part.updated" && event.value.part.type === "text")
            answer = event.value.part.text;
          if (event.value.type === "session.status" && event.value.runStatus === "completed") break;
        }
        expect(answer).toBe("model-2:restored");
      } finally {
        await adapter.deleteSession({ sessionId });
        await events.return?.();
      }
    },
  );

  it("tracks agent configuration updates for later sends and response metadata", async () => {
    const adapter = createAdapter("models-update");
    const sessionId = "models-update-session";
    await adapter.createSession({ directory: process.cwd() });
    try {
      await adapter.sendMessage({ sessionId, content: "update", model: selectedModel });
      await adapter.sendMessage({ sessionId, content: "after", model: { providerId: "fake", modelId: "model-2" } });
      expect((await adapter.listMessages!({ sessionId })).messages).toMatchObject([
        { role: "user" },
        { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-1:update" }), expect.objectContaining({ modelID: "model-1" })]) },
        { role: "user" },
        { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-2:after" }), expect.objectContaining({ modelID: "model-2" })]) },
      ]);
    } finally {
      await adapter.deleteSession({ sessionId });
    }
  });

  it("serializes competing sends without changing the model during a response", async () => {
    const adapter = createAdapter("models");
    const sessionId = "models-session";
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    await adapter.createSession({ directory: process.cwd() });
    try {
      const first = adapter.sendMessage({ sessionId, content: "permission", model: selectedModel });
      while (true) {
        const event = await events.next();
        if (event.done) throw new Error("Event stream closed before approval");
        if (event.value.type === "approval.requested") break;
      }
      const second = adapter.sendMessage({ sessionId, content: "second", model: { providerId: "fake", modelId: "model-2" } });
      await adapter.respondToInteraction({ kind: "permission", sessionId, interactionId: `${sessionId}:model-wait`, value: { optionId: "allow" } });
      await Promise.all([first, second]);
      expect((await adapter.listMessages!({ sessionId })).messages).toMatchObject([
        { role: "user" },
        { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-1:permission" })]) },
        { role: "user" },
        { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-2:second" })]) },
      ]);
    } finally {
      await adapter.deleteSession({ sessionId });
      await events.return?.();
    }
  });

  it("keeps model selections independent across sessions", async () => {
    const adapter = createAdapter("models-resume");
    const directory = process.cwd();
    await adapter.createSession({ sessionId: "one", directory });
    await adapter.createSession({ sessionId: "two", directory });
    try {
      await Promise.all([
        adapter.sendMessage({ sessionId: "one", content: "one", model: selectedModel }),
        adapter.sendMessage({ sessionId: "two", content: "two", model: { providerId: "fake", modelId: "model-2" } }),
      ]);
      expect((await adapter.listMessages!({ sessionId: "one" })).messages).toMatchObject([
        { role: "user" }, { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-1:one" })]) },
      ]);
      expect((await adapter.listMessages!({ sessionId: "two" })).messages).toMatchObject([
        { role: "user" }, { role: "assistant", parts: expect.arrayContaining([expect.objectContaining({ text: "model-2:two" })]) },
      ]);
    } finally {
      await adapter.deleteSession({ sessionId: "one" });
      await adapter.deleteSession({ sessionId: "two" });
    }
  });

  it.each(["delayed-load", "delayed-resume"])(
    "waits for initial %s restoration before sending to the bound session",
    async (profile) => {
      const adapter = createAdapter(profile);
      const directory = process.cwd();
      const sessionId = `${profile}-session`;
      const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
      const restoring = adapter.createSession({ sessionId, directory });
      const approval = await events.next();
      expect(approval.value).toMatchObject({
        type: "approval.requested",
        request: { id: `${sessionId}:restore` },
      });
      await expect(adapter.listPermissions!({ directory })).resolves.toEqual([
        expect.objectContaining({ id: `${sessionId}:restore`, sessionId }),
      ]);
      const sending = adapter.sendMessage({
        sessionId,
        directory,
        content: "hello",
        model: selectedModel,
      });
      await adapter.respondToInteraction({
        kind: "permission",
        sessionId,
        interactionId: `${sessionId}:restore`,
        value: { reply: "once", directory },
      });
      await expect(adapter.listPermissions!({ directory })).resolves.toEqual(
        [],
      );
      await restoring;
      await expect(sending).resolves.toMatchObject({
        interactionId: sessionId,
      });
      await adapter.deleteSession({ sessionId });
      await events.return?.();
    },
  );

  it("shares an in-flight restoration between concurrent sends and history requests", async () => {
    const spy = vi.fn(spawn);
    const adapter = createAcpAdapter({
      id: "concurrent-restore",
      name: "Concurrent restore",
      launch: {
        command: process.execPath,
        args: ["--input-type=module", "--eval", fakeAgent, "delayed-resume"],
      },
      spawn: spy,
      timeoutMs: 2000,
    });
    const directory = process.cwd();
    const sessionId = "delayed-resume-session";
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    const sending = adapter.sendMessage({
      sessionId,
      directory,
      content: "hello",
      model: selectedModel,
    });
    const listing = adapter.listMessages!({ sessionId, directory });
    expect((await events.next()).value).toMatchObject({
      type: "approval.requested",
    });
    await adapter.respondToInteraction({
      kind: "permission",
      sessionId,
      interactionId: `${sessionId}:restore`,
      value: { optionId: "allow" },
    });
    await expect(sending).resolves.toMatchObject({ interactionId: sessionId });
    await listing;
    expect(spy).toHaveBeenCalledTimes(1);
    await adapter.deleteSession({ sessionId });
    await events.return?.();
  });

  it("streams resumed-session activity before the prompt completes without history", async () => {
    const adapter = createAdapter("resume");
    const directory = process.cwd();
    const sessionId = "resume-session";
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    await adapter.createSession({ sessionId, directory });
    const sending = adapter.sendMessage({
      sessionId,
      directory,
      content: "permission",
      model: selectedModel,
    });
    const received = [];
    while (true) {
      const event = await events.next();
      if (event.done)
        throw new Error("Event stream closed before permission request");
      received.push(event.value);
      if (event.value.type === "approval.requested") break;
    }
    expect(received).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "message.part.updated",
          part: expect.objectContaining({
            type: "text",
            text: "resume:permission",
          }),
        }),
      ]),
    );
    await adapter.respondToInteraction({
      kind: "permission",
      sessionId,
      interactionId: `${sessionId}:tool-1`,
      value: { optionId: "allow" },
    });
    await sending;
    await adapter.deleteSession({ sessionId });
    await events.return?.();
  });

  it("retains in-memory conversation when a history reload fails after partial replay", async () => {
    const adapter = createAdapter("reload-failure");
    const directory = process.cwd();
    const sessionId = "reload-failure-session";
    await adapter.createSession({ directory });
    await adapter.sendMessage({ sessionId, directory, content: "hello", model: selectedModel });
    const history = await adapter.listMessages!({ sessionId });
    expect(history).toMatchObject({
      historyUnavailable: true,
      messages: [
        { role: "user", parts: [{ type: "text", text: "hello" }] },
        {
          role: "assistant",
          parts: [
            { type: "text", text: "reload-failure:hello" },
            { type: "step-finish" },
          ],
        },
      ],
    });
    await adapter.deleteSession({ sessionId });
  });

  it("normalizes established tool inputs consistently in live events and history", async () => {
    const adapter = createAdapter("other-tools");
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    const sessionId = "other-tools-session";
    await adapter.createSession({ directory: process.cwd() });
    try {
      await adapter.sendMessage({ sessionId, content: "go", model: selectedModel });
      const parts = [];
      while (true) {
        const next = await events.next();
        if (next.done) break;
        if (next.value.type === "message.part.updated" && next.value.part.type === "tool")
          parts.push(next.value.part);
        if (next.value.type === "session.status" && next.value.runStatus === "completed") break;
      }
      const inputs = [
        ["read", { filePath: "src/a.ts", offset: 5, limit: 9 }],
        ["grep", { pattern: "needle", path: "src", include: "*.ts" }],
        ["glob", { pattern: "**/*.ts", path: "src" }],
        ["webfetch", { url: "https://example.org", format: "markdown", timeout: 30 }],
        ["websearch", { query: "cloudy", numResults: 3 }],
        ["task", { agent: "reviewer", description: "Review code", prompt: "Find defects", sessionId: "child-1" }],
        ["question", { questions: [{ question: "Choose?", header: "Choice", options: [{ label: "A", description: "First" }] }] }],
        ["todowrite", { todos: [{ content: "Start", status: "in_progress" }, { content: "Later", status: "pending" }] }],
      ] as const;
      for (const [index, [name, input]] of inputs.entries()) {
        expect(parts[index * 3]).toMatchObject({ callId: name, status: "pending" });
        expect(parts[index * 3]?.toolName).toBeUndefined();
        expect(parts[index * 3 + 1]).toMatchObject({
          callId: name, toolName: name, status: "running", input,
          metadata: { acp: { name, rawInput: input } },
        });
        expect(parts[index * 3 + 2]).toMatchObject({
          callId: name, toolName: name, status: "completed", input, output: { result: name },
        });
      }
      expect(parts[24]).toMatchObject({ callId: "partial", input: { offset: 2 }, metadata: { acp: { name: "read" } } });
      expect(parts[24]?.toolName).toBeUndefined();
      expect(parts[25]).toMatchObject({ callId: "ambiguous", input: { query: "cloudy" }, status: "failed" });
      expect(parts[25]?.toolName).toBeUndefined();
      expect(parts[26]).toMatchObject({
        callId: "partial", toolName: "read", input: { filePath: "late.txt" },
        status: "failed", output: "not found",
      });
      const history = await adapter.listMessages!({ sessionId });
      const tools = history.messages.flatMap((message) => message.parts.filter((part) => part.type === "tool"));
      expect(tools).toEqual([...inputs.map((_, index) => parts[index * 3 + 2]), parts[26], parts[25]]);
    } finally {
      await adapter.deleteSession({ sessionId });
      await events.return?.();
    }
  });

  it("preserves generic activity across updates and replay", async () => {
    const adapter = createAdapter("generic");
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    const sessionId = "generic-session";
    await adapter.createSession({ directory: process.cwd() });
    try {
      await adapter.sendMessage({ sessionId, content: "go", model: selectedModel });
      const parts = [];
      while (true) {
        const next = await events.next();
        if (next.done) break;
        if (next.value.type === "message.part.updated" && next.value.part.type === "tool")
          parts.push(next.value.part);
        if (next.value.type === "session.status" && next.value.runStatus === "completed") break;
      }
      expect(parts[0]).toMatchObject({ callId: "a", output: { progress: 1 } });
      expect(parts[0]?.status).toBeUndefined();
      expect(parts[0]?.toolName).toBeUndefined();
      expect(parts[1]).toMatchObject({
        callId: "b", title: "Write report", kind: "edit", status: "pending",
        locations: [{ path: "report.txt", line: 4 }],
      });
      expect(parts[1]?.toolName).toBeUndefined();
      expect(parts[2]).toMatchObject({
        callId: "a", toolName: "provider.custom", input: { query: "x" },
        status: "pending", output: { progress: 1 },
      });
      expect(parts[3]).toMatchObject({
        callId: "a", status: "running", output: { count: 2 }, displayContent: ["working"],
      });
      expect(parts[4]).toMatchObject({
        callId: "b", status: "failed", output: "permission denied",
        displayContent: ["permission denied"],
      });
      expect(parts[5]).toMatchObject({
        callId: "a", status: "completed", output: { count: 3 },
        displayContent: ["done"], terminalIds: ["term-1"],
      });
      expect(parts[6]).toMatchObject({
        callId: "a", status: "completed", displayContent: [], terminalIds: [], locations: [],
        metadata: { acp: { name: "provider.custom", rawOutput: null, content: [] } },
      });
      expect(parts[6]?.output).toBeUndefined();
      const history = await adapter.listMessages!({ sessionId });
      const tools = history.messages.flatMap((message) => message.parts.filter((part) => part.type === "tool"));
      expect(tools).toEqual([parts[6], parts[4]]);
    } finally {
      await adapter.deleteSession({ sessionId });
      await events.return?.();
    }
  });

  it("keeps streamed chunks and interleaved tool updates in their owning turns", async () => {
    const adapter = createAdapter("conversation");
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    const directory = process.cwd();
    await adapter.createSession({ directory });
    const received = [];
    for (const [content, turnId] of [
      ["first", "one"],
      ["second", "two"],
    ]) {
      await adapter.sendMessage({
        sessionId: "conversation-session",
        directory,
        content: content!,
        model: selectedModel,
        turnId: turnId!,
      });
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
    }
    expect(received.some((event) => event.type === "message.delta")).toBe(
      false,
    );
    const partial = received.find(
      (event) =>
        event.type === "message.part.updated" &&
        event.part.type === "tool" &&
        event.part.callId === "a",
    );
    expect(partial).toMatchObject({
      part: { type: "tool", callId: "a", output: { progress: 1 } },
    });
    if (
      partial?.type !== "message.part.updated" ||
      partial.part.type !== "tool"
    )
      throw new Error("missing partial tool");
    expect(partial.part.toolName).toBeUndefined();
    expect(partial.part.status).toBeUndefined();
    const page = await adapter.listMessages?.({
      sessionId: "conversation-session",
    });
    const assistants =
      page?.messages.filter((message) => message.role === "assistant") ?? [];
    expect(assistants).toHaveLength(2);
    expect(assistants[0]?.parts).toMatchObject([
      { type: "text", text: "Hello" },
      {
        type: "tool",
        callId: "a",
        toolName: "read",
        status: "completed",
        output: { delayed: true },
      },
      {
        type: "tool",
        callId: "b",
        toolName: "write",
        status: "completed",
        output: { done: "b" },
      },
      { type: "text", text: " world" },
      { type: "step-finish" },
    ]);
    expect(assistants[1]?.parts).toMatchObject([
      { type: "text", text: "Next" },
      { type: "text", text: " turn" },
      { type: "step-finish" },
    ]);
    let stream = { messages: new Map(), pendingDeltas: new Map() };
    for (const event of received)
      stream = applyChatEvent(stream, event, "conversation-session");
    expect(stream.messages.get(assistants[0]!.id)?.parts).toEqual(
      assistants[0]!.parts,
    );
    expect(stream.messages.get(assistants[1]!.id)?.parts).toEqual(
      assistants[1]!.parts,
    );
    const delayed = received.find(
      (event) =>
        event.type === "message.part.updated" &&
        event.part.type === "tool" &&
        event.part.callId === "a" &&
        event.part.output != null &&
        typeof event.part.output === "object" &&
        "delayed" in event.part.output &&
        event.part.output.delayed === true,
    );
    expect(delayed).toMatchObject({ messageId: assistants[0]?.id });
    await adapter.deleteSession({ sessionId: "conversation-session" });
    await events.return?.();
  });

  it("merges live and reloaded turns despite changed wire IDs and chunk boundaries", async () => {
    const adapter = createAdapter("replay-conversation");
    const directory = process.cwd();
    const sessionId = "replay-conversation-session";
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    await adapter.createSession({ directory });
    let stream: MessageStreamState = {
      messages: new Map(),
      pendingDeltas: new Map(),
    };
    for (const content of ["first", "second"]) {
      await adapter.sendMessage({ sessionId, directory, content, model: selectedModel });
      while (true) {
        const next = await events.next();
        if (next.done) break;
        stream = applyChatEvent(stream, next.value, sessionId);
        if (
          next.value.type === "session.status" &&
          next.value.runStatus === "completed"
        )
          break;
      }
    }
    const live = [...stream.messages.values()];
    const history = await adapter.listMessages?.({ sessionId });
    expect(history?.messages).toMatchObject([
      { role: "user", parts: [{ type: "text", text: "first" }] },
      {
        role: "assistant",
        parts: [
          { type: "text", text: "Hello" },
          { type: "tool", output: { delayed: true } },
          { type: "tool", output: { done: "b" } },
          { type: "text", text: " world" },
        ],
      },
      { role: "user", parts: [{ type: "text", text: "second" }] },
      {
        role: "assistant",
        parts: [
          { type: "text", text: "Next" },
          { type: "text", text: " turn" },
        ],
      },
    ]);
    for (const message of history?.messages ?? []) {
      const streamed = live.find((item) => item.id === message.id);
      expect(streamed).toBeDefined();
      expect(message.parts.map(({ id, type }) => ({ id, type }))).toEqual(
        streamed?.parts
          .filter((part) => part.type !== "step-finish")
          .map(({ id, type }) => ({ id, type })),
      );
    }
    const refreshed = await adapter.listMessages?.({ sessionId });
    await adapter.abortSession({ sessionId });
    const reopened = await adapter.listMessages?.({ sessionId, directory });
    for (const page of [refreshed, reopened])
      expect(
        page?.messages.map((message) => ({
          id: message.id,
          parts: message.parts.map(({ id, type }) => ({ id, type })),
        })),
      ).toEqual(
        history?.messages.map((message) => ({
          id: message.id,
          parts: message.parts.map(({ id, type }) => ({ id, type })),
        })),
      );
    await adapter.deleteSession({ sessionId });
    await events.return?.();
  });

  it("does not invent a user message when replay contains only an answer", async () => {
    const adapter = createAdapter("no-user");
    const directory = process.cwd();
    await adapter.createSession({ directory });
    const history = await adapter.listMessages?.({
      sessionId: "no-user-session",
    });
    expect(history?.messages).toMatchObject([
      { role: "assistant", parts: [{ type: "text", text: "Only answer" }] },
    ]);
    await adapter.deleteSession({ sessionId: "no-user-session" });
  });

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
      model: selectedModel,
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
    expect(received.some((event) => event.type === "message.delta")).toBe(
      false,
    );
    expect(received).toContainEqual(
      expect.objectContaining({
        type: "message.part.updated",
        part: expect.objectContaining({
          type: "tool",
          toolName: "edit",
          status: "running",
          output: "editing",
          displayContent: ["editing"],
        }),
      }),
    );
    const page = await adapter.listMessages?.({ sessionId: "events-session" });
    const assistants =
      page?.messages.filter((message) => message.role === "assistant") ?? [];
    expect(assistants).toHaveLength(1);
    expect(assistants[0]?.id).toBe("acp:events-session:0");
    expect(assistants[0]?.parts.map((part) => part.type)).toEqual([
      "reasoning",
      "tool",
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
          changes: [{ path: "app.ts", before: "old", after: "new" }],
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
          modelID: "model-1",
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
      model: { providerId: "fake", modelId: "model-2" },
      turnId: "turn-2",
    });
    const nextPage = await adapter.listMessages?.({
      sessionId: "events-session",
    });
    const nextAssistants =
      nextPage?.messages.filter((message) => message.role === "assistant") ??
      [];
    expect(nextAssistants).toHaveLength(2);
    expect(nextAssistants[1]?.id).toBe("acp:events-session:1");
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
      model: selectedModel,
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
      model: selectedModel,
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

  it("completes a prompt after permission waits beyond the lifecycle timeout", async () => {
    const adapter = createAdapter("permission");
    const sessionId = "permission-session";
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    await adapter.createSession({ directory: process.cwd() });

    try {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const prompt = adapter
        .sendMessage({
          sessionId,
          directory: process.cwd(),
          content: "permission",
          model: selectedModel,
        })
        .catch((error: unknown) => error);
      let event = await events.next();
      while (event.value?.type !== "approval.requested")
        event = await events.next();

      await vi.advanceTimersByTimeAsync(30_001);
      await adapter.respondToInteraction({
        kind: "permission",
        sessionId,
        interactionId: "permission-session:tool-1",
        value: { optionId: "allow" },
      });
      await expect(prompt).resolves.toMatchObject({
        interactionId: sessionId,
        value: { stopReason: "end_turn" },
      });
    } finally {
      vi.useRealTimers();
      await events.return?.();
      await adapter.deleteSession({ sessionId });
    }
  });

  it("replies to pending permissions, cancels sessions, and releases the child process", async () => {
    const adapter = createAdapter("permission");
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    await adapter.createSession({ directory: process.cwd() });

    const prompt = adapter.sendMessage({
      sessionId: "permission-session",
      directory: process.cwd(),
      content: "permission",
      model: selectedModel,
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
      model: selectedModel,
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
        model: selectedModel,
      }),
    ).resolves.toMatchObject({ interactionId: "permission-session" });
    await adapter.deleteSession({ sessionId: "permission-session" });
    await events.return?.();
  });

  it("clears pending permissions when the child process exits", async () => {
    const spy = vi.fn(spawn);
    const adapter = createAcpAdapter({
      id: "exiting-permission",
      name: "Exiting permission",
      launch: {
        command: process.execPath,
        args: ["--input-type=module", "--eval", fakeAgent, "permission"],
      },
      spawn: spy,
      timeoutMs: 2000,
    });
    const directory = process.cwd();
    const sessionId = "permission-session";
    const events = adapter.subscribeEvents()[Symbol.asyncIterator]();
    await adapter.createSession({ directory });
    const prompt = adapter
      .sendMessage({
        sessionId,
        directory,
        content: "permission",
        model: selectedModel,
      })
      .catch((error: unknown) => error);
    try {
      let event = await events.next();
      while (event.value?.type !== "approval.requested")
        event = await events.next();
      await expect(
        adapter.listPermissions!({ directory }),
      ).resolves.toHaveLength(1);
      const child = spy.mock.results[0]?.value;
      if (!child) throw new Error("Missing ACP child process");
      child.kill();
      await expect(prompt).resolves.toMatchObject({ status: 409 });
      await expect(adapter.listPermissions!({ directory })).resolves.toEqual(
        [],
      );
      await expect(
        adapter.respondToInteraction({
          kind: "permission",
          sessionId,
          interactionId: `${sessionId}:tool-1`,
          value: { reply: "once" },
        }),
      ).rejects.toMatchObject({ status: 404 });
    } finally {
      await adapter.abortSession({ sessionId }).catch(() => {});
      await prompt;
      await events.return?.();
    }
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
