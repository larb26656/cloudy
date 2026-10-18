import { describe, expect, it, vi } from "vitest";
import type { LLMClient } from "../../lib/llm-provider";
import { namingSession } from "./naming-session";

function createProvider(chat: LLMClient["chat"]) {
  return { chat } as LLMClient;
}

describe("namingSession", () => {
  it("asks the provider for a title and returns its response", async () => {
    const chat = vi.fn().mockResolvedValue("A descriptive title");
    const provider = createProvider(chat);
    const controller = new AbortController();

    await expect(
      namingSession(
        "model-1",
        provider,
        "Help me plan a trip",
        controller.signal,
      ),
    ).resolves.toBe("A descriptive title");

    expect(chat).toHaveBeenCalledOnce();
    expect(chat).toHaveBeenCalledWith({
      model: "model-1",
      signal: controller.signal,
      message: expect.stringContaining("Help me plan a trip"),
    });
    expect(chat.mock.calls[0]?.[0].message).toContain("Maximum 6 words.");
  });

  it("rejects immediately when the signal is already aborted", async () => {
    const chat = vi.fn();
    const provider = createProvider(chat);
    const controller = new AbortController();
    controller.abort(new Error("Cancelled"));

    await expect(
      namingSession("model-1", provider, "Hello", controller.signal),
    ).rejects.toThrow("Cancelled");
    expect(chat).not.toHaveBeenCalled();
  });

  it("rejects when the signal aborts while the provider request is pending", async () => {
    const chat = vi.fn(() => new Promise<string>(() => {}));
    const provider = createProvider(chat);
    const controller = new AbortController();
    const result = namingSession(
      "model-1",
      provider,
      "Hello",
      controller.signal,
    );

    controller.abort(new Error("Cancelled"));

    await expect(result).rejects.toThrow("Cancelled");
  });

  it("rejects when the provider request times out", async () => {
    vi.useFakeTimers();
    try {
      const chat = vi.fn(() => new Promise<string>(() => {}));
      const result = namingSession("model-1", createProvider(chat), "Hello");
      const assertion = expect(result).rejects.toThrow("Timeout");

      await vi.advanceTimersByTimeAsync(15_000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("propagates provider errors", async () => {
    const chat = vi.fn().mockRejectedValue(new Error("Provider failed"));

    await expect(
      namingSession("model-1", createProvider(chat), "Hello"),
    ).rejects.toThrow("Provider failed");
  });
});
