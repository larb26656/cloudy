import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DiffView } from "./DiffView";

const diff = `--- a/example.ts
+++ b/example.ts
@@ -1,2 +1,2 @@
-const value = "old";
+const value = "new";
 export { value };`;

const diffWithLongContext = `--- a/context.ts
+++ b/context.ts
@@ -1,14 +1,14 @@
 context-1
 context-2
 context-3
 context-4
 context-5
-const value = "old";
+const value = "new";
 context-7
 context-8
 context-9
 context-10
 context-11
 context-12
 context-13
 context-14`;

const diffWithNearbyChanges = `--- a/nearby.ts
+++ b/nearby.ts
@@ -1,10 +1,10 @@
 context-1
 context-2
-const first = "old";
+const first = "new";
 context-4
 context-5
 context-6
 context-7
-const second = "old";
+const second = "new";
 context-9
 context-10`;

function createLongDiff(filePath: string, additions: number) {
  const lines = Array.from(
    { length: additions },
    (_, index) => `+line-${index}`,
  ).join("\n");

  return `diff --git a/${filePath} b/${filePath}
index 1111111..2222222 100644
--- a/${filePath}
+++ b/${filePath}
@@ -0,0 +1,${additions} @@
${lines}`;
}

describe("DiffView", () => {
  test("provides one line-number position for a unified diff", () => {
    const { container } = render(
      <DiffView
        diff={diff}
        filePath="example.ts"
        viewMode="line-by-line"
        showLineNumbers={true}
      />,
    );

    expect(container.querySelector(".diff")).toHaveClass("diff-unified");
    expect(
      container.querySelector(".diff-gutter-delete:nth-child(2)"),
    ).toHaveTextContent("1");
    expect(
      container.querySelector(".diff-gutter-insert:nth-child(2)"),
    ).toHaveTextContent("1");
  });

  test("does not collapse the gutters in a split diff", () => {
    const { container } = render(
      <DiffView
        diff={diff}
        filePath="example.ts"
        viewMode="side-by-side"
        showLineNumbers={true}
      />,
    );

    expect(container.querySelector(".diff")).not.toHaveClass("diff-unified");
  });

  test("shows context lines by default", () => {
    const { container } = render(
      <DiffView
        diff={diff}
        filePath="example.ts"
        viewMode="line-by-line"
        showLineNumbers={true}
      />,
    );

    expect(container.querySelector(".diff-code-normal")).toHaveTextContent(
      "export { value };",
    );
  });

  test("does not show progressive controls when the diff fits the limit", () => {
    render(
      <DiffView
        diff={diff}
        filePath="example.ts"
        viewMode="line-by-line"
        showLineNumbers={true}
        progressiveLineLimit={500}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Load 500 more" }),
    ).not.toBeInTheDocument();
  });

  test.each(["line-by-line", "side-by-side"] as const)(
    "shows only insertions and deletions in %s mode when requested",
    (viewMode) => {
      const { container } = render(
        <DiffView
          diff={diff}
          filePath="example.ts"
          viewMode={viewMode}
          showLineNumbers={true}
          showOnlyChanges={true}
        />,
      );

      expect(
        container.querySelector(".diff-code-normal"),
      ).not.toBeInTheDocument();
      expect(container.querySelector(".diff-code-delete")).toHaveTextContent(
        'const value = "old";',
      );
      expect(container.querySelector(".diff-code-insert")).toHaveTextContent(
        'const value = "new";',
      );
    },
  );

  test("merges overlapping context around nearby change groups", () => {
    const { container } = render(
      <DiffView
        diff={diffWithNearbyChanges}
        filePath="nearby.ts"
        viewMode="line-by-line"
        showLineNumbers={true}
        compactContextLines={3}
      />,
    );

    expect(container.querySelectorAll(".diff-code-normal")).toHaveLength(8);
    expect(
      screen.queryByText(/unchanged lines? hidden/),
    ).not.toBeInTheDocument();
  });

  test("shows three context lines around changes and marks omitted ranges", () => {
    const { container } = render(
      <DiffView
        diff={diffWithLongContext}
        filePath="context.ts"
        viewMode="line-by-line"
        showLineNumbers={true}
        compactContextLines={3}
      />,
    );

    expect(container.querySelectorAll(".diff-code-normal")).toHaveLength(6);
    expect(container).not.toHaveTextContent("context-1");
    expect(container).toHaveTextContent("context-3");
    expect(container).toHaveTextContent("context-9");
    expect(container).not.toHaveTextContent("context-10");
    expect(
      screen.getByText("… 2 unchanged lines hidden …"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("… 5 unchanged lines hidden …"),
    ).toBeInTheDocument();
  });

  test.each(["line-by-line", "side-by-side"] as const)(
    "keeps compact changes and omission markers aligned in %s mode",
    (viewMode) => {
      const { container } = render(
        <DiffView
          diff={diffWithLongContext}
          filePath="context.ts"
          viewMode={viewMode}
          showLineNumbers={true}
          compactContextLines={3}
        />,
      );

      expect(container.querySelector(".diff-code-delete")).toHaveTextContent(
        'const value = "old";',
      );
      expect(container.querySelector(".diff-code-insert")).toHaveTextContent(
        'const value = "new";',
      );
      expect(
        screen.getByText("… 2 unchanged lines hidden …"),
      ).toBeInTheDocument();
    },
  );

  test("toggles full context and resets to compact for a different file", async () => {
    const { container, rerender } = render(
      <DiffView
        diff={diffWithLongContext}
        filePath="context.ts"
        viewMode="line-by-line"
        showLineNumbers={true}
        compactContextLines={3}
        showFullContextToggle={true}
      />,
    );

    expect(container).not.toHaveTextContent("context-1");
    fireEvent.click(screen.getByRole("button", { name: "Show full context" }));
    expect(container).toHaveTextContent("context-1");
    expect(
      screen.getByRole("button", { name: "Show compact diff" }),
    ).toHaveAttribute("aria-pressed", "true");

    rerender(
      <DiffView
        diff={diffWithLongContext}
        filePath="other.ts"
        viewMode="line-by-line"
        showLineNumbers={true}
        compactContextLines={3}
        showFullContextToggle={true}
      />,
    );

    expect(container).not.toHaveTextContent("context-1");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Show full context" }),
      ).toHaveAttribute("aria-pressed", "false");
    });
  });

  test("renders a large diff progressively in 500-line batches", () => {
    const largeDiff = createLongDiff("large.txt", 1600);
    render(
      <DiffView
        diff={largeDiff}
        filePath="large.txt"
        viewMode="line-by-line"
        showLineNumbers={true}
        progressiveLineLimit={500}
      />,
    );

    expect(screen.getByText("Showing 500 of 1605 lines")).toBeInTheDocument();
    expect(screen.getByText("line-494")).toBeInTheDocument();
    expect(screen.queryByText("line-495")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Load 500 more" }));
    expect(screen.getByText("Showing 1000 of 1605 lines")).toBeInTheDocument();
    expect(screen.getByText("line-994")).toBeInTheDocument();
    expect(screen.queryByText("line-995")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Load 500 more" }));
    expect(screen.getByText("Showing 1500 of 1605 lines")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Load 500 more" }));
    expect(
      screen.queryByRole("button", { name: "Load 500 more" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("line-1599")).toBeInTheDocument();
  });

  test("resets the progressive limit when the diff changes", async () => {
    const { rerender } = render(
      <DiffView
        diff={createLongDiff("first.txt", 12)}
        filePath="first.txt"
        viewMode="line-by-line"
        showLineNumbers={true}
        progressiveLineLimit={10}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Load 10 more" }));
    expect(
      screen.queryByRole("button", { name: "Load 10 more" }),
    ).not.toBeInTheDocument();

    rerender(
      <DiffView
        diff={createLongDiff("second.txt", 12)}
        filePath="second.txt"
        viewMode="line-by-line"
        showLineNumbers={true}
        progressiveLineLimit={10}
      />,
    );

    expect(screen.queryByText("line-5")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Showing 10 of 17 lines")).toBeInTheDocument();
    });
  });
});
