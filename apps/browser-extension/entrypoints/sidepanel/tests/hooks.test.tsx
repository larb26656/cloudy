// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Message } from "@repo/ui/components/message/types";
import { useInjectedContexts } from "../hooks/useInjectedContexts";
import { useSelectedText } from "../hooks/useSelectedText";
import { INJECTED_CONTEXT_MARKER } from "../lib/opencode/sessions";

function message(text: string, role: "user" | "assistant" = "user"): Message {
  return {
    info: { id: text, sessionID: "session-1", role, time: { created: 1 } },
    parts: [
      { id: text, sessionID: "session-1", messageID: text, type: "text", text },
    ],
  } as Message;
}

async function waitFor(expectation: () => void | Promise<void>) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await expectation();
      return;
    } catch {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    }
  }

  await expectation();
}

describe("sidepanel hooks", () => {
  let root: ReturnType<typeof createRoot> | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    vi.unstubAllGlobals();
  });

  it("matches only context injected in the current messages", async () => {
    let isInContext: (context: string) => Promise<boolean> = async () => false;

    function Probe({ messages }: { messages: Message[] }) {
      ({ isInContext } = useInjectedContexts(messages));
      return null;
    }

    const container = document.createElement("div");
    root = createRoot(container);
    await act(async () => {
      root?.render(
        <Probe
          messages={[message(`${INJECTED_CONTEXT_MARKER}\npage context`)]}
        />,
      );
    });

    await waitFor(async () => {
      expect(
        await isInContext(`${INJECTED_CONTEXT_MARKER}\npage context`),
      ).toBe(true);
    });
    expect(await isInContext("normal user message")).toBe(false);

    await act(async () => {
      root?.render(<Probe messages={[]} />);
    });

    await waitFor(async () => {
      expect(
        await isInContext(`${INJECTED_CONTEXT_MARKER}\npage context`),
      ).toBe(false);
    });
  });

  it("updates from valid text selection messages and removes its listener", () => {
    const listeners = new Set<(message: unknown) => void>();
    const addListener = vi.fn((listener: (message: unknown) => void) => {
      listeners.add(listener);
    });
    const removeListener = vi.fn((listener: (message: unknown) => void) => {
      listeners.delete(listener);
    });
    vi.stubGlobal("browser", {
      runtime: { onMessage: { addListener, removeListener } },
    });

    let selectedText = "";
    function Probe() {
      selectedText = useSelectedText();
      return null;
    }

    const container = document.createElement("div");
    root = createRoot(container);
    act(() => root?.render(<Probe />));

    expect(addListener).toHaveBeenCalledTimes(1);
    act(() => {
      for (const listener of listeners) {
        listener({ type: "TEXT_SELECTED", text: "selected content" });
        listener({ type: "OTHER", text: "ignored" });
        listener({ type: "TEXT_SELECTED", text: 1 });
      }
    });

    expect(selectedText).toBe("selected content");

    act(() => root?.unmount());
    root = undefined;
    expect(removeListener).toHaveBeenCalledWith(addListener.mock.calls[0]?.[0]);
  });
});
