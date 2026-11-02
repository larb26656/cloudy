import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createAcpAdapter } from "./acp.adapter";
import { createAgentProviderRegistry, createProviderEventHub } from "../index";
import { createAgentProvidersController } from "../../features/providers/providers.controller";

const agent = `
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
const model = process.argv.at(-1);
const server = acp.agent({ name: "catalog-agent" })
  .onRequest(acp.methods.agent.initialize, () => ({ protocolVersion: acp.PROTOCOL_VERSION, agentCapabilities: { sessionCapabilities: { delete: true } } }))
  .onRequest(acp.methods.agent.session.new, () => {
    if (model === "fail") throw new Error("discovery failed");
    return { sessionId: "probe", configOptions: [{ id: "model", name: "Model", category: "model", type: "select", currentValue: model, options: [{ value: model, name: model }] }] };
  })
  .onRequest(acp.methods.agent.session.delete, () => ({}));
server.connect(acp.ndJsonStream(Writable.toWeb(process.stdout), Readable.toWeb(process.stdin)));
`;

describe("ACP model discovery", () => {
  it("retries failures, caches success, and replaces only after a successful refresh", async () => {
    let model = "fail";
    let launches = 0;
    const processes: ChildProcess[] = [];
    const adapter = createAcpAdapter({
      id: "fake",
      name: "Fake",
      catalogDirectory: process.cwd(),
      launch: { command: process.execPath, args: [] },
      timeoutMs: 3000,
      spawn: (command, _args, options) => {
        launches++;
        const child = spawn(
          command,
          ["--input-type=module", "--eval", agent, model],
          options,
        );
        processes.push(child);
        return child;
      },
    });
    const registry = createAgentProviderRegistry({ providers: [adapter] });
    const app = new Hono().route(
      "/api/agent-providers",
      createAgentProvidersController(registry, createProviderEventHub(registry)),
    );
    const catalog = async () => (await app.request("/api/agent-providers")).json();
    const refresh = () =>
      app.request("/api/agent-providers/fake/models/refresh", { method: "POST" });
    expect(await catalog()).toMatchObject({ providers: [], errors: [{ providerId: "fake" }] });
    model = "first";
    expect(await catalog()).toMatchObject({ providers: [{ models: [{ modelId: "first" }] }] });
    expect(await catalog()).toMatchObject({ providers: [{ models: [{ modelId: "first" }] }] });
    expect(launches).toBe(2);
    expect(processes[1]?.killed).toBe(true);
    model = "second";
    expect(await (await refresh()).json()).toMatchObject({ models: [{ modelId: "second" }] });
    model = "fail";
    expect((await refresh()).status).toBe(500);
    expect(await catalog()).toMatchObject({ providers: [{ models: [{ modelId: "second" }] }] });
    expect(launches).toBe(4);
  });
});
