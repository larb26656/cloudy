import { fireEvent, render, screen, within } from "@testing-library/react";
import { AssistantMessageBubble } from "@repo/ui/components/message";
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
    send({ jsonrpc: "2.0", id: request.id, result: { sessionId: "activity-session" } });
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
