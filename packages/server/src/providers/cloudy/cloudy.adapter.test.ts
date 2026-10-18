import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { ChatMessage } from "@repo/ai-core";
import { createLLM } from "../../lib/llm-provider";
import { createTestDb } from "../../db/test-utils";
import { createSessionsRepository } from "../../features/sessions/sessions.repository";
import { createCloudyMessagesRepository } from "../../features/sessions/cloudy-messages.repository";
import { createCloudyAdapter } from "./cloudy.adapter";

function createAdapter(
  apiProviderRegistry = createTestLLM(),
  getDefault: () => { connectionId: string; modelId: string } | null = () =>
    null,
) {
  const { db } = createTestDb();
  const sessionsRepository = createSessionsRepository(db);
  const messagesRepository = createCloudyMessagesRepository(db);
  const adapter = createCloudyAdapter({
    apiProviderRegistry,
    getDefault,
    sessionsRepository,
    messagesRepository,
  });
  return { adapter, sessionsRepository, messagesRepository };
}

function createTestLLM() {
  const llm = createLLM();
  llm.registerProvider("test", {
    configSchema: z.object({}),
    settings: { name: "Test", configFields: [] },
    create: () => ({
      chat: async () => "",
      chatAsync: async function* () {},
    }),
  });
  return llm;
}

describe("createCloudyAdapter", () => {
  it("does not require a directory", async () => {
    const { adapter } = createAdapter();

    expect((await adapter.getInfo()).capabilities.requiresDirectory).toBe(
      false,
    );
  });

  it("exposes registered API provider models", async () => {
    const apiProviderRegistry = createTestLLM();
    apiProviderRegistry.registerClient({
      id: "test",
      type: "test",
      config: {},
      models: [{ modelId: "test-model", name: "Test model" }],
    });
    const { adapter } = createAdapter(apiProviderRegistry);

    expect((await adapter.getInfo()).models).toEqual([
      { modelId: "test-model", name: "Test model", providerId: "test" },
    ]);
  });

  it("requires a configured default when no model is selected", async () => {
    const { adapter, sessionsRepository } = createAdapter();
    const session = await adapter.createSession!({});
    sessionsRepository.create({
      id: session.id,
      providerId: "cloudy",
      providerSessionId: session.id,
    });

    await expect(
      adapter.sendMessage!({ sessionId: session.id, content: "Hello" }),
    ).rejects.toThrow("No default LLM connection and model are configured");
  });

  it("uses the selected configured model when sent by the client", async () => {
    let receivedModel: string | undefined;
    const apiProviderRegistry = createTestLLM();
    apiProviderRegistry.registerClient({
      id: "selected-connection",
      type: "test",
      config: {},
      models: [{ modelId: "selected-model", name: "Selected model" }],
    });
    const { adapter, sessionsRepository } = createAdapter(
      apiProviderRegistry,
      () => ({
        connectionId: "configured-connection",
        modelId: "configured-model",
      }),
    );
    const client = apiProviderRegistry.getClient("selected-connection");
    if (!client) throw new Error("Expected selected provider client");
    client.chatAsync = async function* ({ model }) {
      receivedModel = model;
      yield { text: "response" };
    };
    const session = await adapter.createSession!({});
    sessionsRepository.create({
      id: session.id,
      providerId: "cloudy",
      providerSessionId: session.id,
    });

    await adapter.sendMessage!({
      sessionId: session.id,
      content: "Hello",
      model: { providerId: "selected-connection", modelId: "selected-model" },
    });

    expect(receivedModel).toBe("selected-model");
  });

  it("returns distinct older message pages using the message ID cursor", async () => {
    const { adapter, sessionsRepository, messagesRepository } = createAdapter();
    const session = await adapter.createSession!({});
    sessionsRepository.create({
      id: session.id,
      providerId: "cloudy",
      providerSessionId: session.id,
    });
    for (const id of ["m1", "m2", "m3", "m4", "m5"]) {
      messagesRepository.append(
        {
          id,
          sessionId: session.id,
          role: "user",
          parts: [{ id: `part-${id}`, type: "text", text: id }],
          createdAt: new Date(
            `2026-01-01T00:00:0${id.slice(1)}.000Z`,
          ).toISOString(),
        } satisfies ChatMessage,
        session.id,
      );
    }

    const newerPage = await adapter.listMessages!({
      sessionId: session.id,
      limit: 2,
    });
    const olderPage = await adapter.listMessages!({
      sessionId: session.id,
      limit: 2,
      before: newerPage.nextCursor,
    });

    expect(newerPage.messages.map((message) => message.id)).toEqual([
      "m4",
      "m5",
    ]);
    expect(newerPage.nextCursor).toBe("m4");
    expect(olderPage.messages.map((message) => message.id)).toEqual([
      "m2",
      "m3",
    ]);
  });
});
