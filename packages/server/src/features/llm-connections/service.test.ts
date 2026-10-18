import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadFileConfig } from "../../config/file-loader";
import { createLLM, openaiProviderDefinition } from "../../lib/llm-provider";
import { testConfig } from "../../test-utils";
import { createLLMConnectionService } from "./service";

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

describe("LLM providers service", () => {
  it("creates typed connections, redacts secrets, and persists defaults", () => {
    const configDir = mkdtempSync(path.join(tmpdir(), "cloudy-llm-"));
    tempDirs.push(configDir);
    const llm = createLLM();
    llm.registerProvider("openai", openaiProviderDefinition);
    const service = createLLMConnectionService(testConfig, configDir, llm);
    const connection = service.createConnection({
      name: "Primary",
      type: "openai",
      config: { apiKey: "private-key", baseURL: "https://api.example.test/v1" },
      modelIds: ["model-a", "model-b"],
    });

    expect(service.getSettings().providerTypes).toMatchObject([
      { id: "openai", name: "OpenAI-compatible" },
    ]);
    expect(connection).toMatchObject({
      config: { baseURL: "https://api.example.test/v1" },
      secretsConfigured: { apiKey: true },
      modelIds: ["model-a", "model-b"],
    });
    expect(JSON.stringify(connection)).not.toContain("private-key");
    expect(
      llm.getClient(connection.id)?.models.map((model) => model.modelId),
    ).toEqual(["model-a", "model-b"]);

    service.setDefault({ connectionId: connection.id, modelId: "model-b" });
    expect(loadFileConfig(configDir)).toMatchObject({
      llm: {
        connections: [{ config: { apiKey: "private-key" } }],
        defaultConnectionId: connection.id,
        defaultModelId: "model-b",
      },
    });
  });
});
