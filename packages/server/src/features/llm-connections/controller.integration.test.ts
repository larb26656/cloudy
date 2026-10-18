import { afterEach, describe, expect, it } from "vitest";
import { createTestApp } from "../../test-utils";

describe("LLM provider API", () => {
  let env: ReturnType<typeof createTestApp> | undefined;
  afterEach(() => {
    env?.close();
  });

  it("manages connections and defaults without returning API keys", async () => {
    env = createTestApp();
    const createdResponse = await env.app.request(
      "/api/llm-connections/connections",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Primary",
          type: "openai",
          config: {
            apiKey: "top-secret",
            baseURL: "https://api.example.test/v1",
          },
          modelIds: ["manual-model", "second-model"],
        }),
      },
    );
    expect(createdResponse.status).toBe(201);
    const created = await createdResponse.json();
    expect(created).toMatchObject({
      name: "Primary",
      config: { baseURL: "https://api.example.test/v1" },
      secretsConfigured: { apiKey: true },
      modelIds: ["manual-model", "second-model"],
    });
    expect(JSON.stringify(created)).not.toContain("top-secret");

    const id = created.id as string;
    const defaultResponse = await env.app.request(
      "/api/llm-connections/default",
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ connectionId: id, modelId: "second-model" }),
      },
    );
    expect(defaultResponse.status).toBe(200);
    const listResponse = await env.app.request("/api/llm-connections");
    expect(await listResponse.json()).toMatchObject({
      providerTypes: [
        {
          id: "openai",
          configFields: [
            { key: "apiKey", type: "secret" },
            { key: "baseURL", type: "url" },
          ],
        },
      ],
      default: { connectionId: id, modelId: "second-model" },
    });
  });
});
