import { ApplyPatchTool } from "@repo/ui/components/message";
import { renderWithProviders } from "@/test/utils";

describe("ApplyPatchTool", () => {
  test("renders an apply_patch update as a line-by-line diff", () => {
    renderWithProviders(
      <ApplyPatchTool
        tool="apply_patch"
        state={{
          status: "completed",
          input: {
            patchText: `*** Begin Patch
*** Update File: packages/server/src/container.ts
@@
export const port = 3000;
-export const host = "localhost";
+export const host = "127.0.0.1";
*** End Patch`,
          },
        }}
      />,
    );

    expect(document.querySelector(".diff-unified")).toBeInTheDocument();
    expect(document.body).toHaveTextContent('export const host = "localhost";');
    expect(document.body).toHaveTextContent('export const host = "127.0.0.1";');
    expect(document.body).toHaveTextContent("packages/server/src/container.ts");
  });
});
