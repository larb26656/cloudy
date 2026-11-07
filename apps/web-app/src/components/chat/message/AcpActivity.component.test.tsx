import { fireEvent, render, screen, within } from "@testing-library/react";
import { AssistantMessageBubble, UserMessageBubble } from "@repo/ui/components/message";
import { ToolPart } from "@repo/ui/components/message/parts/ToolPart";
import { createAcpMessageState, mapSessionUpdate } from "../../../../../../packages/server/src/providers/acp/acp.message-mapper";
import { createAcpAdapter } from "../../../../../../packages/server/src/providers/acp/acp.adapter";

const fakeAgent = `
import { createInterface } from "node:readline";
const input = createInterface({ input: process.stdin });
const send = (message) => process.stdout.write(JSON.stringify(message) + "\\n");
input.on("line", (line) => {
  const request = JSON.parse(line);
  if (request.method === "initialize") {
    send({ jsonrpc: "2.0", id: request.id, result: { protocolVersion: 1, agentCapabilities: {}, agentInfo: { name: "fake", version: "1" } } });
  } else if (request.method === "session/new") {
    send({ jsonrpc: "2.0", id: request.id, result: { sessionId: "activity-session", configOptions: [{ id: "model", name: "Model", category: "model", type: "select", currentValue: "model-1", options: [{ value: "model-1", name: "Model One" }] }] } });
  } else if (request.method === "session/prompt") {
    send({ jsonrpc: "2.0", method: "session/update", params: { sessionId: "activity-session", update: { sessionUpdate: "vendor_activity", phase: "review", vendorDetail: { note: "actual payload" } } } });
    send({ jsonrpc: "2.0", id: request.id, result: { stopReason: "end_turn" } });
  }
});
`;

test("shows unmapped ACP activity and discloses the original payload on demand", async () => {
  const adapter = createAcpAdapter({
    id: "fake-activity",
    name: "Fake activity",
    launch: {
      command: process.execPath,
      args: ["--input-type=module", "--eval", fakeAgent],
    },
    timeoutMs: 5000,
  });
  try {
    await adapter.createSession({ directory: process.cwd() });
    await adapter.sendMessage({
      sessionId: "activity-session",
      directory: process.cwd(),
      content: "hello",
      model: { providerId: "fake-activity", modelId: "model-1" },
      turnId: "turn-1",
    });
    const page = await adapter.listMessages?.({
      sessionId: "activity-session",
    });
    const message = page?.messages.find((item) => item.role === "assistant");
    expect(message).toBeDefined();
    render(<AssistantMessageBubble message={message!} />);

    expect(await screen.findByText("vendor_activity")).toBeInTheDocument();
    const disclosure = screen.getByText("Raw part details").closest("details");
    expect(disclosure).not.toHaveAttribute("open");
    expect(within(disclosure!).getByText(/"phase"/)).not.toBeVisible();
    fireEvent.click(screen.getByText("Raw part details"));
    expect(disclosure).toHaveAttribute("open");
    expect(within(disclosure!).getByText(/"phase": "review"/)).toBeVisible();
    expect(
      within(disclosure!).getByText(/"note": "actual payload"/),
    ).toBeVisible();
    expect(within(disclosure!).getByText(/"phase"/).textContent).not.toMatch(
      /"(?:input|output)"/,
    );
  } finally {
    await adapter.deleteSession({ sessionId: "activity-session" });
  }
});

test.each([
  { id: "complete", type: "tool" as const, toolName: "custom", status: "completed" as const },
  { id: "partial", type: "tool" as const },
])("keeps provider tool metadata collapsed for $id activity", (part) => {
  render(<ToolPart part={{ ...part, metadata: { acp: { title: "Provider title", locations: [{ path: "src/file.ts" }] } } }} />);

  const disclosure = screen.getByText("Raw tool details").closest("details")!;
  expect(disclosure).not.toHaveAttribute("open");
  expect(within(disclosure).getByText(/Provider title/)).not.toBeVisible();
  fireEvent.click(screen.getByText("Raw tool details"));
  expect(within(disclosure).getByText(/Provider title/)).toBeVisible();
  expect(within(disclosure).getByText(/src\/file.ts/)).toBeVisible();
});

test("shows unsupported replayed user content with its original payload on demand", async () => {
  const state = createAcpMessageState("session");
  mapSessionUpdate(state, {
    sessionUpdate: "user_message_chunk",
    content: { type: "image", data: "aGVsbG8=", mimeType: "image/png" },
  }, "load");
  const message = state.messages[0]!;
  render(<UserMessageBubble message={message} />);

  expect(await screen.findByText("image")).toBeInTheDocument();
  const disclosure = screen.getByText("Raw part details").closest("details")!;
  expect(disclosure).not.toHaveAttribute("open");
  expect(within(disclosure).getByText(/aGVsbG8=/)).not.toBeVisible();
  fireEvent.click(screen.getByText("Raw part details"));
  expect(within(disclosure).getByText(/aGVsbG8=/)).toBeVisible();
});

test("keeps partial tool input and output collapsed", () => {
  render(
    <ToolPart part={{
      id: "partial",
      type: "tool",
      input: "private input",
      output: "private output",
    }} />,
  );
  const disclosure = screen.getByText("Raw tool details").closest("details")!;
  expect(disclosure).not.toHaveAttribute("open");
  expect(within(disclosure).getByText("private input")).not.toBeVisible();
  expect(within(disclosure).getByText("private output")).not.toBeVisible();
  fireEvent.click(screen.getByText("Raw tool details"));
  expect(within(disclosure).getByText("private input")).toBeVisible();
  expect(within(disclosure).getByText("private output")).toBeVisible();
});
