import type { Meta, StoryObj } from "@storybook/react";
import { DiffViewer } from "./DiffViewer";

const meta: Meta<typeof DiffViewer> = {
  title: "Markdown/DiffViewer",
  component: DiffViewer,
  tags: ["autodocs"],
  argTypes: {
    diff: {
      control: "text",
      description: "Git diff string to display",
    },
    viewMode: {
      control: "select",
      options: ["side-by-side", "line-by-line"],
      description: "View mode for the diff display",
    },
    title: {
      control: "text",
      description: "Optional title for the diff",
    },
    fileNames: {
      control: "object",
      description: "Old and new file names",
    },
    inline: {
      control: "boolean",
      description: "Render as inline (no container/wrapper)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof DiffViewer>;

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
+    "highlight.js": "^11.9.0",
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

export const Default: Story = {
  args: {
    diff: sampleDiff,
    viewMode: "side-by-side",
  },
};

export const LineByLine: Story = {
  args: {
    diff: sampleDiff,
    viewMode: "line-by-line",
  },
};

export const WithTitle: Story = {
  args: {
    diff: sampleDiff,
    title: "src/index.ts changes",
    viewMode: "side-by-side",
  },
};

export const WithFileNames: Story = {
  args: {
    diff: sampleDiff,
    fileNames: { old: "src/index.ts", new: "src/App.tsx" },
    viewMode: "side-by-side",
  },
};

export const MultiFileDiff: Story = {
  args: {
    diff: multiFileDiff,
    viewMode: "side-by-side",
  },
};

export const SmallDiff: Story = {
  args: {
    diff: `diff --git a/README.md b/README.md
index 1234567..89abcdef 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,3 @@
-# Old Title
+# New Title
 
 This is the content of the file.`,
    viewMode: "line-by-line",
  },
};

export const AdditionOnly: Story = {
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
    viewMode: "side-by-side",
  },
};

export const DeletionOnly: Story = {
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
    viewMode: "side-by-side",
  },
};

export const Inline: Story = {
  args: {
    diff: sampleDiff,
    inline: true,
  },
};

export const InlineLineByLine: Story = {
  args: {
    diff: sampleDiff,
    viewMode: "line-by-line",
    inline: true,
  },
};
