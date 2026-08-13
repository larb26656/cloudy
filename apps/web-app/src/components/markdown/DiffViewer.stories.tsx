import preview from "@/storybook/preview";
import { DiffView } from "./DiffView";
import { DiffViewer } from "./DiffViewer";

const meta = preview.meta({
  title: "Markdown/DiffViewer",
  component: DiffViewer,
  tags: ["autodocs"],
  argTypes: {
    diff: {
      control: "text",
      description: "Git diff string to display",
    },
    filePath: {
      control: "text",
      description: "File path — drives language detection and header fallback",
    },
    title: {
      control: "text",
      description:
        "Optional title shown in the header (falls back to filePath)",
    },
    viewMode: {
      control: "select",
      options: ["side-by-side", "line-by-line"],
      description: "Controlled view mode — hides the toggle button when set",
    },
    defaultViewMode: {
      control: "select",
      options: ["side-by-side", "line-by-line"],
      description:
        "Initial view mode when uncontrolled (toggle button visible)",
    },
    showLineNumbers: {
      control: "boolean",
      description: "Controlled line numbers — hides the toggle button when set",
    },
  },
});

export default meta;

const sampleDiff = `diff --git a/src/index.ts b/src/index.ts
index abc1234..def5678 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,10 +1,12 @@
-import { useState } from 'react';
+import { useState, useEffect } from 'react';
 
 export function App() {
   const [count, setCount] = useState(0);
+  const [loading, setLoading] = useState(true);
 
   return (
     <div>
       <h1>Count: {count}</h1>
+      {loading && <p>Loading...</p>}
       <button onClick={() => setCount(count + 1)}>
         Increment
       </button>
     </div>
   );
 }`;

const multiFileDiff = `diff --git a/package.json b/package.json
index 1234567..89abcdef 100644
--- a/package.json
+++ b/package.json
@@ -10,6 +10,7 @@
   "dependencies": {
     "react": "^19.0.0",
     "react-dom": "^19.0.0",
+    "refractor": "^5.0.0",
     "typescript": "~5.3.0"
   }
 }
diff --git a/src/App.tsx b/src/App.tsx
index abcdef12..34567890 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -5,6 +5,9 @@
 function App() {
   return (
     <div className="app">
       <h1>Hello World</h1>
+      <button className="btn-primary">
+        Click me
+      </button>
     </div>
   );
 }`;

const pythonDiff = `diff --git a/src/script.py b/src/script.py
index 1111111..2222222 100644
--- a/src/script.py
+++ b/src/script.py
@@ -1,7 +1,10 @@
-def greet(name):
-    print("Hello, " + name)
+def greet(name, greeting="Hello"):
+    print(f"{greeting}, {name}!")
 
-greet("World")
+def main():
+    greet("World")
+    greet("Alice", greeting="Hi")
+
+main()`;

const longDiff = `diff --git a/src/server.ts b/src/server.ts
index 1111111..2222222 100644
--- a/src/server.ts
+++ b/src/server.ts
@@ -1,40 +1,55 @@
-import { Hono } from "hono";
-import { logger } from "hono/logger";
+import { Hono } from "hono";
+import { logger } from "hono/logger";
+import { cors } from "hono/cors";
+import { HTTPException } from "hono/http-exception";
 
-const app = new Hono();
+export function createApp() {
+  const app = new Hono();
+  app.use("*", logger());
+  app.use("*", cors());
 
-app.get("/", (c) => c.text("Hello"));
+  app.get("/", (c) => c.json({ ok: true }));
+  app.get("/health", (c) => c.json({ status: "healthy" }));
 
-app.listen(3000);
+  app.onError((err, c) => {
+    if (err instanceof HTTPException) {
+      return c.json({ error: err.message }, err.status);
+    }
+    return c.json({ error: "Internal Server Error" }, 500);
+  });
+
+  return app;
+}
+
+const port = Number(process.env.PORT ?? 3000);
+createApp().listen({ port });
+console.log(\`Server running on http://localhost:\${port}\`);`;
// Uncontrolled — toggle buttons visible
// ---------------------------------------------------------------------------

export const Default = meta.story({
  args: {
    diff: sampleDiff,
    filePath: "src/index.ts",
  },
});

export const LineByLine = meta.story({
  args: {
    diff: sampleDiff,
    filePath: "src/index.ts",
    defaultViewMode: "line-by-line",
  },
});

// ---------------------------------------------------------------------------
// Controlled — toggle buttons hidden
// ---------------------------------------------------------------------------

export const ControlledSideBySide = meta.story({
  args: {
    diff: sampleDiff,
    filePath: "src/index.ts",
    viewMode: "side-by-side",
  },
});

export const ControlledLineByLine = meta.story({
  args: {
    diff: sampleDiff,
    filePath: "src/index.ts",
    viewMode: "line-by-line",
  },
});

export const WithLineNumbers = meta.story({
  args: {
    diff: sampleDiff,
    filePath: "src/index.ts",
    showLineNumbers: true,
  },
});

// ---------------------------------------------------------------------------
// Header & language detection
// ---------------------------------------------------------------------------

export const WithTitle = meta.story({
  args: {
    diff: sampleDiff,
    filePath: "src/index.ts",
    title: "src/index.ts — React state refactor",
  },
});

export const PythonFile = meta.story({
  args: {
    diff: pythonDiff,
    filePath: "src/script.py",
  },
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

export const MultiFileDiff = meta.story({
  args: {
    diff: multiFileDiff,
    filePath: "package.json",
  },
});

export const SmallDiff = meta.story({
  args: {
    diff: `diff --git a/README.md b/README.md
index 1234567..89abcdef 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,3 @@
-# Old Title
+# New Title
 
 This is the content of the file.`,
    filePath: "README.md",
    defaultViewMode: "line-by-line",
  },
});

export const AdditionOnly = meta.story({
  args: {
    diff: `diff --git a/src/utils.ts b/src/utils.ts
index 0000000..1234567 100644
--- /dev/null
+++ b/src/utils.ts
@@ -0,0 +1,5 @@
+export function helper() {
+  console.log("Helper function");
+  return true;
+}
+`,
    filePath: "src/utils.ts",
  },
});

export const DeletionOnly = meta.story({
  args: {
    diff: `diff --git a/src/old.ts b/src/old.ts
index 1234567..0000000 100644
--- a/src/old.ts
+++ /dev/null
@@ -1,5 +0,0 @@
-export function unused() {
-  console.log("This is no longer needed");
-  return false;
-}
-`,
    filePath: "src/old.ts",
  },
});

export const RawViewWithMaxHeight = meta.story({
  args: {
    diff: longDiff,
    filePath: "src/server.ts",
    showLineNumbers: true,
    viewMode: "line-by-line",
  },
  render: (args) => (
    <DiffView
      diff={args.diff}
      filePath={args.filePath}
      viewMode={args.viewMode ?? "line-by-line"}
      showLineNumbers={args.showLineNumbers ?? false}
      maxHeight={240}
    />
  ),
});

export const RawViewFillParent = meta.story({
  args: {
    diff: longDiff,
    filePath: "src/server.ts",
    showLineNumbers: true,
    viewMode: "line-by-line",
  },
  render: (args) => (
    <div className="flex h-[400px] w-full flex-col rounded-md border border-[#404040] bg-[#1e1e1e] p-2">
      <DiffView
        diff={args.diff}
        filePath={args.filePath}
        viewMode={args.viewMode ?? "line-by-line"}
        showLineNumbers={args.showLineNumbers ?? false}
        className="min-h-0 flex-1"
      />
    </div>
  ),
});

export const RawViewChangesOnly = meta.story({
  args: {
    diff: sampleDiff,
    filePath: "src/index.ts",
    showLineNumbers: true,
    viewMode: "line-by-line",
  },
  render: (args) => (
    <DiffView
      diff={args.diff}
      filePath={args.filePath}
      viewMode={args.viewMode ?? "line-by-line"}
      showLineNumbers={args.showLineNumbers ?? false}
      showOnlyChanges={true}
    />
  ),
});
