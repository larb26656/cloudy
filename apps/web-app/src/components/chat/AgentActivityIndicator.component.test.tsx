import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { AgentActivityIndicator } from "./AgentActivityIndicator";

describe("AgentActivityIndicator", () => {
  test("shows working activity for its session", () => {
    render(<AgentActivityIndicator state="working" />);

    expect(screen.getByLabelText("Working")).toHaveClass(
      "bg-info",
      "animate-pulse",
    );
  });

  test("shows why the session is waiting for a person", () => {
    render(
      <AgentActivityIndicator state="wait-for-human" reason="permission" />,
    );

    expect(screen.getByLabelText("Permission required")).toHaveClass(
      "bg-destructive",
    );
  });

  test("renders nothing when the session has no activity", () => {
    const { container } = render(<AgentActivityIndicator state="idle" />);

    expect(container).toBeEmptyDOMElement();
  });
});
