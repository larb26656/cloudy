import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  chatgptPlanProviderDefinition,
  createLLM,
} from "../../../lib/llm-provider";
import type { ChatGPTCredentials } from "../../../lib/siwc/credentials";
import { ConflictError } from "../../../shared/domain-error";
import { createChatGPTPlanService } from "./chatgpt-plan.service";

vi.mock("./chatgpt-plan.oauth-login", () => ({
  startOAuthLogin: vi.fn(async () => ({ started: true })),
}));

const credentials: ChatGPTCredentials = {
  client_id: "client-id",
  access_token: "access-token",
  refresh_token: "refresh-token",
  id_token: "id-token",
  subject: "account-id",
  email: "person@example.com",
  scopes: ["chatgpt.tokens.use.direct"],
  expires_at: Date.now() + 60 * 60 * 1000,
  ext_agent_host_id: "host-id",
};

describe("ChatGPT plan service", () => {
  let configDir: string;
  let llm: ReturnType<typeof createLLM>;
  let service: ReturnType<typeof createChatGPTPlanService>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    configDir = await mkdtemp(path.join(tmpdir(), "cloudy-chatgpt-plan-"));
    await writeFile(
      path.join(configDir, "chatgpt-plan-credentials.json"),
      JSON.stringify(credentials),
    );
    llm = createLLM();
    llm.registerProvider("chatgpt-plan", chatgptPlanProviderDefinition);
    service = createChatGPTPlanService(configDir, llm);
    fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        models: [
          { slug: "gpt-5", display_name: "GPT-5", visibility: "list" },
          { slug: "hidden", display_name: "Hidden", visibility: "private" },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(configDir, { recursive: true, force: true });
  });

  it("restores the connection with only listed models", async () => {
    await service.registerConfiguredConnection();

    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/models", {
      headers: { authorization: "Bearer access-token" },
    });
    expect(llm.getClient("chatgpt-plan")?.models).toMatchObject([
      { modelId: "gpt-5", name: "GPT-5", providerName: "ChatGPT plan" },
    ]);
    await expect(service.status()).resolves.toMatchObject({
      connected: true,
      connecting: false,
      email: "person@example.com",
      error: null,
    });
  });

  it("records a restore error and removes a stale client when no models are available", async () => {
    await service.registerConfiguredConnection();
    expect(llm.getClient("chatgpt-plan")).toBeDefined();
    fetchMock.mockResolvedValue(Response.json({ models: [] }));

    await service.registerConfiguredConnection();

    expect(llm.getClient("chatgpt-plan")).toBeUndefined();
    await expect(service.status()).resolves.toMatchObject({
      connected: false,
      error: "No ChatGPT plan models are available",
    });
  });

  it("rejects duplicate sign-in attempts and clears pending state on cancel", async () => {
    await service.connect();

    await expect(service.connect()).rejects.toThrow(ConflictError);
    await expect(service.status()).resolves.toMatchObject({ connecting: true });
    await expect(service.cancel()).resolves.toEqual({ connecting: false });
    await expect(service.status()).resolves.toMatchObject({
      connecting: false,
    });
  });
});
