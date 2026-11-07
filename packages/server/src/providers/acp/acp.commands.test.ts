import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { EventEmitter, once } from "node:events";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as acp from "@agentclientprotocol/sdk";
import type { ChatEvent } from "@repo/ai-core";
import { createAcpAdapter } from "./acp.adapter";
import { createAgentProviderRegistry, createProviderEventHub } from "../index";
import { createAgentProvidersController } from "../../features/providers/providers.controller";

interface Profile {
  commands?: acp.AvailableCommand[];
  sessionId?: string;
  deferResponse?: boolean;
  noCommands?: boolean;
  failNew?: boolean;
  failAfterCommands?: boolean;
  cleanup?: "hang" | "fail";
}

const agent = `
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
const profile = JSON.parse(process.argv.at(-1));
const sessionId = profile.sessionId ?? "commands-" + process.pid;
const response = Promise.withResolvers();
const model = { id: "model", name: "Model", category: "model", type: "select", currentValue: "model-1", options: [{ value: "model-1", name: "Model One" }, { value: "model-2", name: "Model Two" }] };
const emit = (commands) => connection.client.notify(acp.methods.client.session.update, { sessionId, update: { sessionUpdate: "available_commands_update", availableCommands: commands } });
const server = acp.agent({ name: "command-agent" })
  .onRequest(acp.methods.agent.initialize, () => ({ protocolVersion: acp.PROTOCOL_VERSION, agentCapabilities: { sessionCapabilities: { delete: true } } }))
  .onRequest(acp.methods.agent.session.new, async () => {
    process.send?.({ type: "new" });
    if (profile.failNew) throw new Error("command discovery failed");
    if (!profile.noCommands) {
      await emit(profile.commands ?? []);
      process.send?.({ type: "emitted" });
    }
    if (profile.deferResponse) await response.promise;
    if (profile.failAfterCommands) throw new Error("session creation failed after commands");
    return { sessionId, configOptions: [model] };
  })
  .onRequest(acp.methods.agent.session.delete, async () => {
    process.send?.({ type: "cleanup" });
    if (profile.cleanup === "hang") await Promise.withResolvers().promise;
    if (profile.cleanup === "fail") throw new Error("cleanup failed");
    return {};
  })
  .onRequest(acp.methods.agent.session.setConfigOption, ({ params }) => {
    model.currentValue = params.value;
    return { configOptions: [model] };
  })
  .onRequest(acp.methods.agent.session.prompt, async ({ params, client }) => {
    await client.notify(acp.methods.client.session.update, { sessionId, update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: model.currentValue + ":" + params.prompt[0].text } } });
    return { stopReason: "end_turn" };
  });
const connection = server.connect(acp.ndJsonStream(Writable.toWeb(process.stdout), Readable.toWeb(process.stdin)));
process.on("message", async (message) => {
  if (message.type === "respond") {
    response.resolve();
    return;
  }
  if (message.type !== "commands") return;
  await emit(message.commands);
  process.send?.({ type: "updated" });
});
`;

const directory = fileURLToPath(new URL("../../../", import.meta.url)).replace(
  /\/$/,
  "",
);

interface AgentProcess {
  child: ChildProcess;
  probe: boolean;
  directory: string;
  messages: string[];
  exited: Promise<void>;
  waitFor: (type: string, count?: number) => Promise<void>;
}

const allProcesses: AgentProcess[] = [];

function createFixture(
  profile: (input: { directory: string; probe: boolean }) => Profile,
  timeoutMs = 1500,
) {
  const processes: AgentProcess[] = [];
  const launches = new EventEmitter();
  const adapter = createAcpAdapter({
    id: "commands",
    name: "Commands",
    launch: { command: process.execPath, args: ["session"] },
    catalogLaunch: { command: process.execPath, args: ["--no-session"] },
    timeoutMs,
    spawn: (command, args, options) => {
      const probe = args.includes("--no-session");
      const cwd = String(options.cwd);
      const child = spawn(
        command,
        [
          "--input-type=module",
          "--eval",
          agent,
          JSON.stringify(profile({ directory: cwd, probe })),
        ],
        { ...options, stdio: ["pipe", "pipe", "pipe", "ipc"] },
      );
      const messages: string[] = [];
      const events = new EventEmitter();
      child.on("message", (message) => {
        if (
          message !== null &&
          typeof message === "object" &&
          "type" in message &&
          typeof message.type === "string"
        ) {
          messages.push(message.type);
          events.emit(message.type);
        }
      });
      const exited = once(child, "exit").then(() => undefined);
      const process: AgentProcess = {
        child,
        probe,
        directory: cwd,
        messages,
        exited,
        waitFor: async (type, count = 1) => {
          while (messages.filter((message) => message === type).length < count)
            await once(events, type);
        },
      };
      processes.push(process);
      allProcesses.push(process);
      launches.emit("spawn");
      return child;
    },
  });
  const registry = createAgentProviderRegistry({ providers: [adapter] });
  const app = new Hono().route(
    "/api/agent-providers",
    createAgentProvidersController(registry, createProviderEventHub(registry)),
  );
  const get = (input: { directory?: string } = {}) => {
    const query = new URLSearchParams({
      directory: input.directory ?? directory,
    });
    return app.request(`/api/agent-providers/commands/commands?${query}`);
  };
  return {
    adapter,
    registry,
    get,
    processes,
    async waitForProcess(index: number) {
      while (!processes[index]) await once(launches, "spawn");
      return processes[index]!;
    },
  };
}

afterEach(async () => {
  vi.useRealTimers();
  const processes = allProcesses.splice(0);
  for (const { child } of processes) if (!child.killed) child.kill();
  await Promise.all(processes.map(({ exited }) => exited));
});

describe("ACP command catalog", () => {
  it("shares cold discovery and returns the complete cached catalog", async () => {
    const fixture = createFixture(() => ({ noCommands: true }));
    const pendingReview = fixture.get();
    const pendingPlan = fixture.get();
    const process = await fixture.waitForProcess(0);
    await process.waitFor("new");
    process.child.send({
      type: "commands",
      commands: [
        {
          name: "review",
          description: "Review a change",
          input: { hint: "revision" },
        },
        { name: "plan", description: "Plan work" },
      ],
    });
    const [review, plan] = await Promise.all([pendingReview, pendingPlan]);
    expect(review.status).toBe(200);
    const commands = [
      { name: "review", description: "Review a change", hints: ["revision"] },
      { name: "plan", description: "Plan work" },
    ];
    expect(await review.json()).toEqual(commands);
    expect(await plan.json()).toEqual(commands);
    expect(fixture.processes).toHaveLength(1);
    expect(fixture.processes[0]?.probe).toBe(true);
    await process.waitFor("cleanup");
    expect(fixture.processes[0]?.child.killed).toBe(true);
    expect(await (await fixture.get()).json()).toEqual(commands);
    expect(fixture.processes).toHaveLength(1);
  });

  it("accepts early empty events, caches them, and isolates absolute directories", async () => {
    const otherDirectory = join(directory, "src");
    const fixture = createFixture((input) => ({
      commands:
        input.directory === directory
          ? []
          : [{ name: "other", description: "Other directory" }],
    }));
    const empty = await fixture.get();
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual([]);
    expect(await (await fixture.get()).json()).toEqual([]);
    expect(fixture.processes).toHaveLength(1);
    expect(
      await (await fixture.get({ directory: otherDirectory })).json(),
    ).toEqual([{ name: "other", description: "Other directory" }]);
    expect(await (await fixture.get()).json()).toEqual([]);
    expect(fixture.processes.map(({ directory }) => directory)).toEqual([
      directory,
      otherDirectory,
    ]);
    expect(fixture.processes.every(({ child }) => child.killed)).toBe(true);
  });

  it("uses real session events before session/new returns and replaces catalogs without chat activity", async () => {
    const fixture = createFixture(({ probe }) => ({
      commands: [
        { name: probe ? "discovered" : "live", description: "Initial" },
      ],
    }));
    expect(await (await fixture.get()).json()).toEqual([
      { name: "discovered", description: "Initial" },
    ]);
    const session = await fixture.adapter.createSession({ directory });
    expect(await (await fixture.get()).json()).toEqual([
      { name: "live", description: "Initial" },
    ]);
    const live = fixture.processes.find(({ probe }) => !probe)!;
    live.child.send({
      type: "commands",
      commands: [{ name: "replacement", description: "Latest" }],
    });
    await live.waitFor("updated");
    await expect
      .poll(async () => (await fixture.get()).json())
      .toEqual([{ name: "replacement", description: "Latest" }]);
    live.child.send({ type: "commands", commands: [] });
    await live.waitFor("updated", 2);
    await expect.poll(async () => (await fixture.get()).json()).toEqual([]);
    expect(
      await fixture.adapter.listMessages!({ sessionId: session.id, directory }),
    ).toMatchObject({
      messages: [],
    });
    expect(fixture.processes).toHaveLength(2);
  });

  it("does not overwrite a newer real catalog when an early probe snapshot returns later", async () => {
    const fixture = createFixture(({ probe }) => ({
      commands: [
        { name: probe ? "old-probe" : "new-live", description: "Commands" },
      ],
      deferResponse: probe,
    }));
    const pending = fixture.get();
    const probe = await fixture.waitForProcess(0);
    await probe.waitFor("emitted");
    await fixture.adapter.createSession({ directory });
    expect(await (await fixture.get()).json()).toEqual([
      { name: "new-live", description: "Commands" },
    ]);
    probe.child.send({ type: "respond" });
    expect(await (await pending).json()).toEqual([
      { name: "new-live", description: "Commands" },
    ]);
    expect(probe.child.killed).toBe(true);
    expect(fixture.processes).toHaveLength(2);
  });

  it("retries discovery after a failure", async () => {
    let profile: Profile = { failNew: true };
    const fixture = createFixture(() => profile);
    expect((await fixture.get()).status).toBe(500);
    profile = { commands: [{ name: "first", description: "First" }] };
    expect(await (await fixture.get()).json()).toEqual([
      { name: "first", description: "First" },
    ]);
    expect(fixture.processes.every(({ child }) => child.killed)).toBe(true);
  });

  it("errors rather than returning [] when no event arrives and cleans up", async () => {
    let profile: Profile = { noCommands: true };
    const fixture = createFixture(() => profile);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const cold = fixture.get();
    const first = await fixture.waitForProcess(0);
    await first.waitFor("new");
    await vi.advanceTimersByTimeAsync(1500);
    expect((await cold).status).toBe(500);
    expect(first.child.killed).toBe(true);
    vi.useRealTimers();
    profile = {
      commands: [{ name: "kept", description: "Keep this catalog" }],
    };
    expect(await (await fixture.get()).json()).toEqual([
      { name: "kept", description: "Keep this catalog" },
    ]);
  });

  it.each(["hang", "fail"] as const)(
    "bounds %s cleanup and still terminates a successful probe",
    async (cleanup) => {
      const fixture = createFixture(() => ({
        commands: [{ name: "ready", description: "Available" }],
        cleanup,
      }));
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const pending = fixture.get();
      const probe = await fixture.waitForProcess(0);
      await probe.waitFor("cleanup");
      await vi.advanceTimersByTimeAsync(1500);
      const response = await pending;
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([
        { name: "ready", description: "Available" },
      ]);
      expect(probe.child.killed).toBe(true);
      await probe.exited;
    },
  );

  it("invokes slash commands through the normal model, message, and status stream", async () => {
    const fixture = createFixture(() => ({
      commands: [{ name: "review", description: "Review changes" }],
    }));
    const session = await fixture.adapter.createSession({ directory });
    const controller = new AbortController();
    const events: ChatEvent[] = [];
    const streamed = (async () => {
      for await (const event of fixture.adapter.subscribeEvents({
        sessionId: session.id,
        signal: controller.signal,
      }))
        events.push(event);
    })();
    const result = await fixture.registry.executeCommand("commands", {
      sessionId: session.id,
      directory,
      command: "review",
      arguments: "staged changes",
      model: { providerId: "commands", modelId: "model-2" },
    });
    controller.abort();
    await streamed;
    expect(result).toMatchObject({ interactionId: session.id });
    const history = await fixture.adapter.listMessages!({
      sessionId: session.id,
      directory,
    });
    expect(
      history.messages.map(({ role, parts }) => ({
        role,
        text: parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(""),
      })),
    ).toEqual([
      { role: "user", text: "/review staged changes" },
      { role: "assistant", text: "model-2:/review staged changes" },
    ]);
    expect(
      events
        .filter((event) => event.type === "session.status")
        .map((event) => event.runStatus),
    ).toEqual(["running", "completed"]);
    expect(events.some((event) => event.type === "message.part.updated")).toBe(
      true,
    );
    await fixture.registry.executeCommand("commands", {
      sessionId: session.id,
      directory,
      command: "review",
      model: { providerId: "commands", modelId: "model-2" },
    });
    const nextHistory = await fixture.adapter.listMessages!({
      sessionId: session.id,
      directory,
    });
    expect(nextHistory.messages.at(-2)?.parts).toContainEqual(
      expect.objectContaining({
        type: "text",
        text: "/review",
      }),
    );
    expect(fixture.processes).toHaveLength(1);
  });
});
