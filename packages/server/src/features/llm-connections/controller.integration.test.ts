import { afterEach, describe, expect, it } from "vitest";
import { createTestApp } from "../../test-utils";

describe("LLM provider API", () => {
  let env: ReturnType<typeof createTestApp> | undefined;
  afterEach(() => {
    env?.close();
  });

  it("manages connections without returning API keys or storing defaults", async () => {
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
    const listResponse = await env.app.request("/api/llm-connections");
    const settings = await listResponse.json();
    expect(settings).toMatchObject({
      providerTypes: [
        {
          id: "openai",
          configFields: [
            { key: "apiKey", type: "secret" },
            { key: "baseURL", type: "url" },
          ],
        },
      ],
      connections: [{ id }],
    });
    expect(listResponse.status).toBe(200);
    expect(settings.default).toBeUndefined();
  });
});
