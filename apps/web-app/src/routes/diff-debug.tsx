import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DiffViewer } from "@/components/markdown/DiffViewer";

const MOCK_DIFF = `--- a/src/components/markdown/DiffViewer.tsx
+++ b/src/components/markdown/DiffViewer.tsx
@@ -1,5 +1,6 @@
 import { useMemo, useState, useEffect, useRef } from "react";
 import { html as diff2html } from "diff2html";
+import hljs from "highlight.js";
 import "diff2html/bundles/css/diff2html.min.css";

 interface Props {
@@ -20,6 +21,10 @@
 export function DiffViewer({ diff, filePath }: Props) {
   const diffHtml = diff2html(diff);

+  useEffect(() => {
+    // Apply syntax highlighting
+  }, [diffHtml]);
+
   return <div dangerouslySetInnerHTML={{ __html: diffHtml }} />;
 }
`;

export const Route = createFileRoute("/diff-debug")({
  component: DiffDebugPage,
});

function DiffDebugPage() {
  const [, setRerender] = useState(0);
  const [counter, setCounter] = useState(0);

  return (
    <div className="min-h-screen bg-[#1e1e1e] p-8">
      <h1 className="text-white text-2xl mb-4">DiffViewer Debug</h1>
      <button
        onClick={() => setCounter((n) => n + 1)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Force Re-render ({Math.random()})
      </button>
      <div className="max-w-6xl mx-auto">
        { counter }
        <div className="flex flex-col gap 2">
          <DiffViewer
            diff={MOCK_DIFF}
            filePath="src/components/markdown/DiffViewer.tsx"
            defaultViewMode="side-by-side"
            showLineNumbers={true}
          />
        </div>

      </div>
      <div className="mt-8 p-4 bg-gray-900 rounded text-white">
        <h2 className="text-lg font-bold mb-2">Debug Info</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(
            {
              language: "tsx",
              filePath: "src/components/markdown/DiffViewer.tsx",
              diffLines: MOCK_DIFF.split("\n").length,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}
