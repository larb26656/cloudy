import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FileTypeIcon } from "./FileTypeIcon";

describe("FileTypeIcon", () => {
  it("renders an inline <svg> for a known extension", () => {
    const { container } = render(<FileTypeIcon name="hello.ts" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    // vscode-icons typescript icon body uses the official #007acc fill
    expect(container.innerHTML).toContain("#007acc");
  });

  it("renders an svg with aria-hidden for a11y", () => {
    const { container } = render(<FileTypeIcon name="readme.md" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("applies the requested pixel size", () => {
    const { container } = render(<FileTypeIcon name="a.js" size={24} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("24");
    expect(svg?.getAttribute("height")).toBe("24");
  });

  it("falls back to the default-file icon for unknown types (still renders)", () => {
    const { container } = render(<FileTypeIcon name="weird.xyz" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("respects full-filename overrides (package.json → npm)", () => {
    const { container } = render(<FileTypeIcon name="package.json" />);
    // npm icon uses the brand's signature red (#c12127 in this icon set)
    expect(container.innerHTML).toContain("#c12127");
  });

  it("carries the project's data-icon attribute convention", () => {
    const { container } = render(<FileTypeIcon name="a.ts" />);
    const svg = container.querySelector("svg");
    expect(svg?.hasAttribute("data-icon")).toBe(true);
  });
});
