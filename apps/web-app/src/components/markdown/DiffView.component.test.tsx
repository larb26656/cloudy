import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DiffView } from "./DiffView";

const diff = `--- a/example.ts
+++ b/example.ts
@@ -1,2 +1,2 @@
-const value = "old";
+const value = "new";
 export { value };`;

describe("DiffView", () => {
  test("renders a unified diff", () => {
    const { container } = render(
      <DiffView
        diff={diff}
        filePath="example.ts"
        viewMode="line-by-line"
        showLineNumbers={true}
      />,
    );

    expect(container.querySelector(".diff")).toHaveClass("diff-unified");
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
});
