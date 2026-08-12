import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { FilesChanges } from "./FilesChanges";
import { FilesExplorer } from "./FilesExplorer";
import { FilesSearch } from "./FilesSearch";

vi.mock("@/hooks/queries/useFiles", () => ({
  useVcsDiff: () => ({
    data: [
      {
        file: "src/example.ts",
        additions: 1,
        deletions: 0,
        status: "modified",
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("./FileTree", () => ({
  FileTree: () => <div>File tree</div>,
}));

vi.mock("./FileSearchResults", () => ({
  FileSearchResults: () => <div>Search results</div>,
}));

vi.mock("./FilePreview", () => ({
  FilePreview: () => <div>File preview</div>,
}));

describe("files responsive sidebar", () => {
  test.each([
    [
      "changes",
      <FilesChanges key="changes" directory="/workspace" />,
      "Show file list",
    ],
    [
      "explorer",
      <FilesExplorer key="explorer" directory="/workspace" />,
      "Show file tree",
    ],
    [
      "search",
      <FilesSearch key="search" directory="/workspace" />,
      "Show search",
    ],
  ])(
    "shows the %s sidebar toggle before selecting a file",
    (_, view, title) => {
      render(view);

      expect(screen.getByTitle(title)).toBeInTheDocument();
    },
  );
});
