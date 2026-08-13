import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MermaidNode } from "./MermaidNode";

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
  updateNodeData: vi.fn(),
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: mocks.initialize,
    render: mocks.render,
  },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({ updateNodeData: mocks.updateNodeData }),
}));

vi.mock("../WindowFrame", () => ({
  WindowFrame: ({
    headerAction,
    children,
  }: {
    headerAction?: ReactNode;
    children: ReactNode;
  }) => (
    <div>
      {headerAction}
      {children}
    </div>
  ),
}));

function renderNode(data: { code?: string } = {}) {
  const props = {
    id: "node.1",
    data,
    selected: false,
  } as ComponentProps<typeof MermaidNode>;

  return render(<MermaidNode {...props} />);
}

async function advanceRenderDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
}

describe("MermaidNode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.initialize.mockReset();
    mocks.render.mockReset();
    mocks.updateNodeData.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("edits with CodeEditor and persists code to the node data", async () => {
    renderNode();

    fireEvent.click(screen.getByRole("button", { name: "Edit Mermaid code" }));
    const editor = screen.getByRole("textbox", { name: "Mermaid code" });
    fireEvent.change(editor, {
      target: { value: "flowchart TD\n  A --> B" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(499);
    });
    expect(mocks.updateNodeData).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(mocks.updateNodeData).toHaveBeenCalledWith("node.1", {
      code: "flowchart TD\n  A --> B",
    });
  });

  it("keeps the newest async render and uses a selector-safe id", async () => {
    let resolveFirst: ((value: { svg: string }) => void) | undefined;
    mocks.render
      .mockImplementationOnce(
        () =>
          new Promise<{ svg: string }>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({ svg: '<svg aria-label="new diagram" />' });

    renderNode({ code: "flowchart TD\n  A --> B" });
    await advanceRenderDebounce();

    fireEvent.click(screen.getByRole("button", { name: "Edit Mermaid code" }));
    const editor = screen.getByRole("textbox", { name: "Mermaid code" });
    fireEvent.change(editor, {
      target: { value: "flowchart LR\n  B --> C" },
    });
    await advanceRenderDebounce();

    expect(screen.getByLabelText("new diagram")).toBeInTheDocument();
    expect(mocks.render).toHaveBeenLastCalledWith(
      "mermaid-node-1-2",
      "flowchart LR\n  B --> C",
    );

    await act(async () => {
      resolveFirst?.({ svg: '<svg aria-label="old diagram" />' });
    });

    expect(screen.queryByLabelText("old diagram")).not.toBeInTheDocument();
    expect(screen.getByLabelText("new diagram")).toBeInTheDocument();
  });
});
