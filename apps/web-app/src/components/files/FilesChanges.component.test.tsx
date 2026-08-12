import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { FilesChanges } from "./FilesChanges";

const useVcsDiffMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/queries/useFiles", () => ({
  useVcsDiff: useVcsDiffMock,
}));

vi.mock("@/components/markdown/DiffView", () => ({
  DiffView: ({ filePath }: { filePath: string }) => (
    <div data-testid={`diff-${filePath}`}>{filePath} diff</div>
  ),
}));

vi.mock("./FileDetail", () => ({
  FileDetail: ({ file }: { file: { file: string } | null }) => (
    <div data-testid="file-detail">{file?.file ?? "No selection"}</div>
  ),
}));

const files = [
  {
    file: "src/first.ts",
    additions: 2,
    deletions: 1,
    status: "modified",
    patch: "first patch",
  },
  {
    file: "src/second.ts",
    additions: 4,
    deletions: 0,
    status: "added",
    patch: "second patch",
  },
  {
    file: "README.md",
    additions: 0,
    deletions: 3,
    status: "deleted",
  },
];

function getAccordionTrigger(filePath: RegExp) {
  const trigger = screen
    .getAllByRole("button", { name: filePath })
    .find((button) => button.hasAttribute("aria-expanded"));

  if (!trigger) throw new Error("Accordion trigger not found");
  return trigger;
}

describe("FilesChanges view modes", () => {
  beforeEach(() => {
    useVcsDiffMock.mockReturnValue({
      data: files,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  test("starts in all-files mode with every file expanded", () => {
    render(<FilesChanges directory="/workspace" />);

    expect(
      screen.getByRole("group", { name: "Changes view" }).parentElement,
    ).not.toHaveClass("@files:hidden");
    expect(screen.getByRole("button", { name: "All files" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("diff-src/first.ts")).toBeInTheDocument();
    expect(screen.getByTestId("diff-src/second.ts")).toBeInTheDocument();
    expect(
      screen.getByText("This file has no inline patch to display."),
    ).toBeInTheDocument();
  });

  test("collapses an individual file and expands it again", async () => {
    render(<FilesChanges directory="/workspace" />);

    const firstFileTrigger = getAccordionTrigger(/src\/first\.ts/);
    fireEvent.click(firstFileTrigger);
    await waitFor(() => {
      expect(screen.queryByTestId("diff-src/first.ts")).not.toBeInTheDocument();
    });

    fireEvent.click(firstFileTrigger);
    await waitFor(() => {
      expect(screen.getByTestId("diff-src/first.ts")).toBeInTheDocument();
    });
  });

  test("switches to single-file mode and selects a file from the sheet", () => {
    render(<FilesChanges directory="/workspace" />);

    fireEvent.click(screen.getByRole("button", { name: "Single file" }));
    fireEvent.click(screen.getByTitle("Show file list"));

    const sheet = screen.getByRole("dialog", { name: "Changed files" });
    fireEvent.click(
      within(sheet).getByRole("button", { name: /src\/second\.ts/ }),
    );

    expect(screen.getByTestId("file-detail")).toHaveTextContent(
      "src/second.ts",
    );
    expect(
      screen.queryByRole("dialog", { name: "Changed files" }),
    ).not.toBeInTheDocument();
  });

  test("resets the mode, selection, and expanded files for a new directory", async () => {
    const { rerender } = render(<FilesChanges directory="/workspace" />);

    fireEvent.click(getAccordionTrigger(/src\/first\.ts/));
    fireEvent.click(screen.getByRole("button", { name: "Single file" }));
    fireEvent.click(screen.getByTitle("Show file list"));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Changed files" })).getByRole(
        "button",
        { name: /src\/first\.ts/ },
      ),
    );

    rerender(<FilesChanges directory="/another-workspace" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "All files" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
    expect(screen.getByTestId("file-detail")).toHaveTextContent("No selection");
    expect(screen.getByTestId("diff-src/first.ts")).toBeInTheDocument();
  });
});
