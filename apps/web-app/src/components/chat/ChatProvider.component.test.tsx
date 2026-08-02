import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { ChatProvider, useChat } from "./ChatProvider";
import { useDefaultAgentStore } from "@/stores/defaultAgentStore";
import { useDefaultModelStore } from "@/stores/defaultModelStore";
import { useSessionAgentModelStore } from "@/stores/sessionAgentModelStore";

const model = {
  providerID: "openai",
  modelID: "gpt-5",
  name: "GPT-5",
  maxTokens: 128_000,
  supportsStreaming: true,
  supportsTools: true,
};

const sessionModel = {
  ...model,
  modelID: "claude-sonnet",
  name: "Claude Sonnet",
};

function ChatSelection() {
  const { effectiveAgent, effectiveModel, setAgent, setModel } = useChat();

  return (
    <>
      <span data-testid="agent">{effectiveAgent}</span>
      <span data-testid="model">{effectiveModel?.name}</span>
      <button onClick={() => setAgent("build")}>Select agent</button>
      <button onClick={() => setModel(model)}>Select model</button>
      <button onClick={() => setAgent(null)}>Use default agent</button>
      <button onClick={() => setModel(null)}>Use default model</button>
    </>
  );
}

function renderChat(sessionId: string | null) {
  return render(
    <ChatProvider workspace={null} directory="/project" sessionId={sessionId}>
      <ChatSelection />
    </ChatProvider>,
  );
}

describe("ChatProvider", () => {
  beforeEach(() => {
    useDefaultAgentStore.setState({ defaultAgent: null });
    useDefaultModelStore.setState({ defaultModel: null });
    useSessionAgentModelStore.setState({ sessions: {} });
  });

  test("uses global defaults when the session has no selection", () => {
    useDefaultAgentStore.setState({ defaultAgent: "plan" });
    useDefaultModelStore.setState({ defaultModel: model });

    renderChat("ses_1");

    expect(screen.getByTestId("agent")).toHaveTextContent("plan");
    expect(screen.getByTestId("model")).toHaveTextContent("GPT-5");
  });

  test("saves selections made before a new session exists as defaults", async () => {
    renderChat(null);

    await act(async () => {
      screen.getByRole("button", { name: "Select agent" }).click();
      screen.getByRole("button", { name: "Select model" }).click();
    });

    expect(screen.getByTestId("agent")).toHaveTextContent("build");
    expect(screen.getByTestId("model")).toHaveTextContent("GPT-5");
    expect(useDefaultAgentStore.getState().defaultAgent).toBe("build");
    expect(useDefaultModelStore.getState().defaultModel).toEqual(model);
  });

  test("uses and updates selections scoped to the active session", async () => {
    useDefaultAgentStore.setState({ defaultAgent: "plan" });
    useDefaultModelStore.setState({ defaultModel: model });
    useSessionAgentModelStore.setState({
      sessions: { ses_1: { agent: "explore", model: sessionModel } },
    });

    renderChat("ses_1");

    expect(screen.getByTestId("agent")).toHaveTextContent("explore");
    expect(screen.getByTestId("model")).toHaveTextContent("Claude Sonnet");

    await act(async () => {
      screen.getByRole("button", { name: "Select agent" }).click();
      screen.getByRole("button", { name: "Select model" }).click();
    });

    expect(useSessionAgentModelStore.getState().sessions.ses_1).toEqual({
      agent: "build",
      model,
    });
    expect(useDefaultAgentStore.getState().defaultAgent).toBe("plan");
    expect(useDefaultModelStore.getState().defaultModel).toEqual(model);
  });

  test("returns each session field to its global default independently", async () => {
    useDefaultAgentStore.setState({ defaultAgent: "plan" });
    useDefaultModelStore.setState({ defaultModel: model });
    useSessionAgentModelStore.setState({
      sessions: { ses_1: { agent: "explore", model: sessionModel } },
    });

    renderChat("ses_1");

    await act(async () => {
      screen.getByRole("button", { name: "Use default agent" }).click();
    });

    expect(screen.getByTestId("agent")).toHaveTextContent("plan");
    expect(screen.getByTestId("model")).toHaveTextContent("Claude Sonnet");
    expect(useSessionAgentModelStore.getState().sessions.ses_1).toEqual({
      model: sessionModel,
    });

    await act(async () => {
      screen.getByRole("button", { name: "Use default model" }).click();
    });

    expect(screen.getByTestId("model")).toHaveTextContent("GPT-5");
    expect(useSessionAgentModelStore.getState().sessions.ses_1).toBeUndefined();
  });

  test("does not apply one session's selection to another session", async () => {
    const { rerender } = renderChat("ses_1");

    await act(async () => {
      screen.getByRole("button", { name: "Select agent" }).click();
      screen.getByRole("button", { name: "Select model" }).click();
    });

    rerender(
      <ChatProvider workspace={null} directory="/project" sessionId="ses_2">
        <ChatSelection />
      </ChatProvider>,
    );

    expect(screen.getByTestId("agent")).toBeEmptyDOMElement();
    expect(screen.getByTestId("model")).toBeEmptyDOMElement();
    expect(useSessionAgentModelStore.getState().sessions.ses_1).toEqual({
      agent: "build",
      model,
    });
    expect(useSessionAgentModelStore.getState().sessions.ses_2).toBeUndefined();
  });
});
