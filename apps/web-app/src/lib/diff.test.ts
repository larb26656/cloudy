import { createTwoFilesPatch } from "diff";
import { parseDiff } from "react-diff-view";
import { describe, expect, it } from "vitest";
import { normalizeDiff } from "./diff";

describe("normalizeDiff", () => {
  it("makes createTwoFilesPatch output parseable by react-diff-view", () => {
    const diff = createTwoFilesPatch(
      "example.ts",
      "example.ts",
      "const value = 1;",
      "const value = 2;",
    );

    const files = parseDiff(normalizeDiff(diff));

    expect(files).toHaveLength(1);
    expect(files[0]?.hunks).toHaveLength(1);
    expect(files[0]?.hunks[0]?.changes).toHaveLength(2);
  });

  it("leaves standard git diffs unchanged", () => {
    const diff = `diff --git a/example.ts b/example.ts
index 1111111..2222222 100644
--- a/example.ts
+++ b/example.ts
@@ -1 +1 @@
-const value = 1;
+const value = 2;`;

    expect(normalizeDiff(diff)).toBe(diff);
  });
});
