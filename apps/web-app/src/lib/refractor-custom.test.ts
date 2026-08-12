import { markEdits, parseDiff, tokenize } from "react-diff-view";
import { describe, expect, it } from "vitest";
import refractor from "./refractor-custom";

describe("refractor-custom", () => {
  it("tokenizes highlighted diff hunks with edit markers", () => {
    const diff = `--- a/example.ts
+++ b/example.ts
@@ -1 +1 @@
-const value: string = "old";
+const value: number = 1;`;
    const file = parseDiff(diff)[0];

    expect(file).toBeDefined();
    const hunks = file?.hunks ?? [];
    const tokens = tokenize(hunks, {
      highlight: true,
      refractor,
      language: "typescript",
      enhancers: [markEdits(hunks)],
    });

    expect(refractor.registered("typescript")).toBe(true);
    expect(tokens.old[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          properties: { className: ["token", "keyword"] },
        }),
        expect.objectContaining({ type: "edit" }),
      ]),
    );
    expect(tokens.new[0]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "edit" })]),
    );
  });
});
