import { describe, expect, it, vi } from "vitest";
import { chatgptPlanProviderDefinition } from "./openai";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  readAccessToken: vi.fn().mockResolvedValue("access-token"),
}));

vi.mock("openai", () => ({
  default: class {
    responses = { create: mocks.create };
  },
}));

vi.mock("../../siwc/credentials", () => ({
  readChatGPTAccessToken: mocks.readAccessToken,
}));

describe("ChatGPT plan provider", () => {
  it("supports non-streaming chat by collecting the streaming response", async () => {
    mocks.create.mockResolvedValueOnce(
      (async function* () {
        yield { type: "response.output_text.delta", delta: "A title" };
        yield { type: "response.completed" };
      })(),
    );
    const client = chatgptPlanProviderDefinition.create({
      credentialPath: "/credentials.json",
    });

    await expect(
      client.chat({ model: "gpt-5", message: "Name this session" }),
    ).resolves.toBe("A title");
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-5", stream: true }),
      undefined,
    );
  });
});
