import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { FilesChanges } from "./FilesChanges";

const useVcsDiffMock = vi.hoisted(() => vi.fn());

const offsetHeightDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetHeight",
);
const offsetWidthDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetWidth",
);

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

vi.mock("./FilePreview", () => ({
  FilePreview: ({
    directory,
    path,
  }: {
    directory: string;
    path: string | null;
  }) => (
    <div data-testid="full-file-preview">
      {directory}:{path}
    </div>
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
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 1000,
    });
  });

  afterAll(() => {
    if (offsetHeightDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "offsetHeight",
        offsetHeightDescriptor,
      );
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "offsetHeight");
    }
    if (offsetWidthDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "offsetWidth",
        offsetWidthDescriptor,
      );
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "offsetWidth");
    }
  });

  beforeEach(() => {
    useVcsDiffMock.mockReturnValue({
      data: files,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  test("starts in all-files mode with visible files collapsed", () => {
    render(<FilesChanges directory="/workspace" />);

    expect(
      screen.getByRole("group", { name: "Changes view" }).parentElement,
    ).not.toHaveClass("@files:hidden");
    expect(screen.getByRole("button", { name: "All files" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByTestId("diff-src/first.ts")).not.toBeInTheDocument();
    expect(screen.queryByTestId("diff-src/second.ts")).not.toBeInTheDocument();
    expect(getAccordionTrigger(/src\/first\.ts/)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(getAccordionTrigger(/src\/second\.ts/)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("mounts a diff only while its file is expanded", async () => {
    render(<FilesChanges directory="/workspace" />);

    const firstFileTrigger = getAccordionTrigger(/src\/first\.ts/);
    fireEvent.click(firstFileTrigger);
    await waitFor(() => {
      expect(screen.getByTestId("diff-src/first.ts")).toBeInTheDocument();
    });

    fireEvent.click(firstFileTrigger);
    await waitFor(() => {
      expect(screen.queryByTestId("diff-src/first.ts")).not.toBeInTheDocument();
    });
  });

  test("only mounts diff rows near the virtual viewport", async () => {
    const manyFiles = Array.from({ length: 30 }, (_, index) => ({
      file: `src/file-${index}.ts`,
      additions: 1,
      deletions: 0,
      status: "modified",
      patch: `patch ${index}`,
    }));
    useVcsDiffMock.mockReturnValue({
      data: manyFiles,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<FilesChanges directory="/workspace" />);

    expect(
      screen.getByRole("button", {
        name: "Open full file: src/file-0.ts",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Open full file: src/file-29.ts",
      }),
    ).not.toBeInTheDocument();

    fireEvent.scroll(screen.getByTestId("all-files-changes-scroll"), {
      target: { scrollTop: 18_000 },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Open full file: src/file-29.ts",
        }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", {
        name: "Open full file: src/file-0.ts",
      }),
    ).not.toBeInTheDocument();
  });

  test("opens a full file from all-files mode without toggling its diff", () => {
    render(<FilesChanges directory="/workspace" />);

    const firstFileTrigger = getAccordionTrigger(/src\/first\.ts/);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Open full file: src/first.ts",
      }),
    );

    expect(firstFileTrigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("dialog", { name: "src/first.ts" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("full-file-preview")).toHaveTextContent(
      "/workspace:src/first.ts",
    );
    expect(
      screen.queryByRole("button", {
        name: "Open full file: README.md",
      }),
    ).not.toBeInTheDocument();
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

  test("opens the selected full file in single-file mode", () => {
    render(<FilesChanges directory="/workspace" />);

    fireEvent.click(screen.getByRole("button", { name: "Single file" }));
    fireEvent.click(screen.getByTitle("Show file list"));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Changed files" })).getByRole(
        "button",
        { name: /src\/second\.ts/ },
      ),
    );
    const openButtons = screen.getAllByRole("button", {
      name: "Open full file: src/second.ts",
    });
    fireEvent.click(openButtons[openButtons.length - 1]!);

    expect(
      screen.getByRole("dialog", { name: "src/second.ts" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("full-file-preview")).toHaveTextContent(
      "/workspace:src/second.ts",
    );
  });

  test("hides the full-file action for a selected deleted file", () => {
    render(<FilesChanges directory="/workspace" />);

    fireEvent.click(screen.getByRole("button", { name: "Single file" }));
    fireEvent.click(screen.getByTitle("Show file list"));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Changed files" })).getByRole(
        "button",
        { name: /README\.md/ },
      ),
    );

    expect(
      screen.queryByRole("button", {
        name: "Open full file: README.md",
      }),
    ).not.toBeInTheDocument();
  });

  test("closes the full-file dialog when the directory changes", async () => {
    const { rerender } = render(<FilesChanges directory="/workspace" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open full file: src/first.ts",
      }),
    );
    rerender(<FilesChanges directory="/another-workspace" />);

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "src/first.ts" }),
      ).not.toBeInTheDocument();
    });
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
    expect(screen.queryByTestId("diff-src/first.ts")).not.toBeInTheDocument();
    expect(getAccordionTrigger(/src\/first\.ts/)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
