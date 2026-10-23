import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { ChatMessage } from "@repo/ai-core";
import { createLLM } from "../../lib/llm-provider";
import { createTestDb } from "../../db/test-utils";
import { createSessionsRepository } from "../../features/sessions/sessions.repository";
import { createCloudyMessagesRepository } from "../../features/sessions/cloudy-messages.repository";
import { createCloudyAdapter } from "./cloudy.adapter";

function createAdapter(apiProviderRegistry = createTestLLM()) {
  const { db } = createTestDb();
  const sessionsRepository = createSessionsRepository(db);
  const messagesRepository = createCloudyMessagesRepository(db);
  const adapter = createCloudyAdapter({
    apiProviderRegistry,
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

  it("does not support approvals or questions", async () => {
    const { adapter } = createAdapter();
    const { capabilities } = await adapter.getInfo();

    expect(capabilities.approvals).toBe(false);
    expect(capabilities.questions).toBe(false);
  });

  it("exposes registered API provider models", async () => {
    const apiProviderRegistry = createTestLLM();
    apiProviderRegistry.registerClient({
      id: "test",
      type: "test",
      config: {},
      models: [
        {
          modelId: "test-model",
          name: "Test model",
          providerName: "Test connection",
        },
      ],
    });
    const { adapter } = createAdapter(apiProviderRegistry);

    expect((await adapter.getInfo()).models).toEqual([
      {
        modelId: "test-model",
        name: "Test model",
        providerName: "Test connection",
        providerId: "test",
      },
    ]);
  });

  it("requires a model to be selected for the request", async () => {
    const { adapter, sessionsRepository } = createAdapter();
    const session = await adapter.createSession!({});
    sessionsRepository.create({
      id: session.id,
      providerId: "cloudy",
      providerSessionId: session.id,
    });

    await expect(
      adapter.sendMessage!({ sessionId: session.id, content: "Hello" }),
    ).rejects.toThrow("A model must be selected for Cloudy AI");
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
    const { adapter, sessionsRepository } = createAdapter(apiProviderRegistry);
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

    const firstResponse = await adapter.sendMessage!({
      sessionId: session.id,
      content: "Hello",
      model: { providerId: "selected-connection", modelId: "selected-model" },
    });
    const secondResponse = await adapter.sendMessage!({
      sessionId: session.id,
      content: "Again",
      model: { providerId: "selected-connection", modelId: "selected-model" },
    });

    expect(receivedModel).toBe("selected-model");
    expect(firstResponse.isFirstMessage).toBe(true);
    expect(secondResponse.isFirstMessage).toBe(false);
  });

  it("forwards agent events through the provider subscription", async () => {
    const apiProviderRegistry = createTestLLM();
    apiProviderRegistry.registerClient({
      id: "test-connection",
      type: "test",
      config: {},
      models: [{ modelId: "test-model", name: "Test model" }],
    });
    const { adapter, sessionsRepository } = createAdapter(apiProviderRegistry);
    const session = await adapter.createSession!({});
    sessionsRepository.create({
      id: session.id,
      providerId: "cloudy",
      providerSessionId: session.id,
    });
    const iterator = adapter.subscribeEvents!({ sessionId: session.id })[
      Symbol.asyncIterator
    ]();

    await adapter.sendMessage!({
      sessionId: session.id,
      content: "Hello",
      model: { providerId: "test-connection", modelId: "test-model" },
    });

    const firstEvent = await iterator.next();
    const secondEvent = await iterator.next();
    await iterator.return?.();

    expect(firstEvent.value).toMatchObject({
      type: "message.updated",
      sessionId: session.id,
    });
    expect(secondEvent.value).toMatchObject({
      type: "message.updated",
      sessionId: session.id,
    });
  });

  it("returns older message pages in insertion order when timestamps collide", async () => {
    const { adapter, sessionsRepository, messagesRepository } = createAdapter();
    const session = await adapter.createSession!({});
    sessionsRepository.create({
      id: session.id,
      providerId: "cloudy",
      providerSessionId: session.id,
    });
    for (const id of ["c3", "a1", "e5", "b2", "d4"]) {
      messagesRepository.append(
        {
          id,
          sessionId: session.id,
          role: "user",
          parts: [{ id: `part-${id}`, type: "text", text: id }],
          createdAt: "2026-01-01T00:00:00.000Z",
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
    const oldestPage = await adapter.listMessages!({
      sessionId: session.id,
      limit: 2,
      before: olderPage.nextCursor,
    });

    expect(newerPage.messages.map((message) => message.id)).toEqual([
      "b2",
      "d4",
    ]);
    expect(newerPage.nextCursor).toBe("b2");
    expect(olderPage.messages.map((message) => message.id)).toEqual([
      "a1",
      "e5",
    ]);
    expect(olderPage.nextCursor).toBe("a1");
    expect(oldestPage.messages.map((message) => message.id)).toEqual(["c3"]);
    expect(oldestPage.nextCursor).toBeUndefined();
    expect(
      [
        ...oldestPage.messages,
        ...olderPage.messages,
        ...newerPage.messages,
      ].map((message) => message.id),
    ).toEqual(["c3", "a1", "e5", "b2", "d4"]);
  });

  it("treats a missing message cursor as a request for the latest page", async () => {
    const { adapter, sessionsRepository, messagesRepository } = createAdapter();
    const session = await adapter.createSession!({});
    sessionsRepository.create({
      id: session.id,
      providerId: "cloudy",
      providerSessionId: session.id,
    });
    for (const id of ["m1", "m2", "m3"]) {
      messagesRepository.append(
        {
          id,
          sessionId: session.id,
          role: "user",
          parts: [{ id: `part-${id}`, type: "text", text: id }],
          createdAt: "2026-01-01T00:00:00.000Z",
        } satisfies ChatMessage,
        session.id,
      );
    }

    const page = await adapter.listMessages!({
      sessionId: session.id,
      limit: 2,
      before: "missing-cursor",
    });

    expect(page.messages.map((message) => message.id)).toEqual(["m2", "m3"]);
    expect(page.nextCursor).toBe("m2");
  });
});
