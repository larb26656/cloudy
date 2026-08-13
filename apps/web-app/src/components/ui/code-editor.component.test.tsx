import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CodeEditor } from "./code-editor";

describe("CodeEditor", () => {
  it("renders a controlled value and reports edits", () => {
    const onValueChange = vi.fn();
    render(
      <CodeEditor
        value="const initial = true;"
        onValueChange={onValueChange}
        id="source"
      />,
    );

    const editor = screen.getByRole<HTMLTextAreaElement>("textbox");
    expect(editor).toHaveValue("const initial = true;");

    fireEvent.change(editor, { target: { value: "const updated = false;" } });
    expect(onValueChange).toHaveBeenCalledWith("const updated = false;");
  });

  it("inserts two spaces when Tab is pressed", () => {
    const onValueChange = vi.fn();
    render(<CodeEditor value="value" onValueChange={onValueChange} />);

    const editor = screen.getByRole<HTMLTextAreaElement>("textbox");
    editor.setSelectionRange(0, 0);
    fireEvent.keyDown(editor, { key: "Tab" });

    expect(onValueChange).toHaveBeenCalledWith("  value");
  });

  it("highlights supported languages", () => {
    const { container } = render(
      <CodeEditor
        value="const value = true;"
        onValueChange={vi.fn()}
        language="typescript"
      />,
    );

    expect(container.querySelector(".token.keyword")).toHaveTextContent(
      "const",
    );
    expect(container.querySelector(".token.boolean")).toHaveTextContent("true");
  });

  it("renders unsupported languages as escaped plain text", () => {
    const { container } = render(
      <CodeEditor
        value={'<script>alert("x")</script>'}
        onValueChange={vi.fn()}
        language="unknown"
      />,
    );

    const highlighted = container.querySelector("pre");
    expect(highlighted).toHaveTextContent('<script>alert("x")</script>');
    expect(highlighted?.querySelector("script")).not.toBeInTheDocument();
  });

  it("forwards textarea states and supports an external label", () => {
    const onBlur = vi.fn();
    render(
      <>
        <label htmlFor="config">Configuration</label>
        <CodeEditor
          id="config"
          name="config"
          value=""
          onValueChange={vi.fn()}
          placeholder="Enter configuration"
          disabled
          readOnly
          required
          onBlur={onBlur}
        />
      </>,
    );

    const editor = screen.getByRole("textbox", { name: "Configuration" });
    expect(editor).toHaveAttribute("name", "config");
    expect(editor).toHaveAttribute("placeholder", "Enter configuration");
    expect(editor).toBeDisabled();
    expect(editor).toHaveAttribute("readonly");
    expect(editor).toBeRequired();

    fireEvent.blur(editor);
    expect(onBlur).toHaveBeenCalledOnce();
  });
});
