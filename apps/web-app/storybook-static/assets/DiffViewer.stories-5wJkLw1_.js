import{t as e}from"./DiffViewer-DiPDdUO3.js";var t={title:`Markdown/DiffViewer`,component:e,tags:[`autodocs`],argTypes:{diff:{control:`text`,description:`Git diff string to display`},viewMode:{control:`select`,options:[`side-by-side`,`line-by-line`],description:`View mode for the diff display`},title:{control:`text`,description:`Optional title for the diff`},fileNames:{control:`object`,description:`Old and new file names`},inline:{control:`boolean`,description:`Render as inline (no container/wrapper)`}}},n=`diff --git a/src/index.ts b/src/index.ts
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
 }`,r=`diff --git a/package.json b/package.json
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
 }`,i={args:{diff:n,viewMode:`side-by-side`}},a={args:{diff:n,viewMode:`line-by-line`}},o={args:{diff:n,title:`src/index.ts changes`,viewMode:`side-by-side`}},s={args:{diff:n,fileNames:{old:`src/index.ts`,new:`src/App.tsx`},viewMode:`side-by-side`}},c={args:{diff:r,viewMode:`side-by-side`}},l={args:{diff:`diff --git a/README.md b/README.md
index 1234567..89abcdef 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,3 @@
-# Old Title
+# New Title
 
 This is the content of the file.`,viewMode:`line-by-line`}},u={args:{diff:`diff --git a/src/utils.ts b/src/utils.ts
index 0000000..1234567 100644
--- /dev/null
+++ b/src/utils.ts
@@ -0,0 +1,5 @@
+export function helper() {
+  console.log("Helper function");
+  return true;
+}
+`,viewMode:`side-by-side`}},d={args:{diff:`diff --git a/src/old.ts b/src/old.ts
index 1234567..0000000 100644
--- a/src/old.ts
+++ /dev/null
@@ -1,5 +0,0 @@
-export function unused() {
-  console.log("This is no longer needed");
-  return false;
-}
-`,viewMode:`side-by-side`}},f={args:{diff:n,inline:!0}},p={args:{diff:n,viewMode:`line-by-line`,inline:!0}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    diff: sampleDiff,
    viewMode: "side-by-side"
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    diff: sampleDiff,
    viewMode: "line-by-line"
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    diff: sampleDiff,
    title: "src/index.ts changes",
    viewMode: "side-by-side"
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    diff: sampleDiff,
    fileNames: {
      old: "src/index.ts",
      new: "src/App.tsx"
    },
    viewMode: "side-by-side"
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    diff: multiFileDiff,
    viewMode: "side-by-side"
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    diff: \`diff --git a/README.md b/README.md
index 1234567..89abcdef 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,3 @@
-# Old Title
+# New Title
 
 This is the content of the file.\`,
    viewMode: "line-by-line"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    diff: \`diff --git a/src/utils.ts b/src/utils.ts
index 0000000..1234567 100644
--- /dev/null
+++ b/src/utils.ts
@@ -0,0 +1,5 @@
+export function helper() {
+  console.log("Helper function");
+  return true;
+}
+\`,
    viewMode: "side-by-side"
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    diff: \`diff --git a/src/old.ts b/src/old.ts
index 1234567..0000000 100644
--- a/src/old.ts
+++ /dev/null
@@ -1,5 +0,0 @@
-export function unused() {
-  console.log("This is no longer needed");
-  return false;
-}
-\`,
    viewMode: "side-by-side"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    diff: sampleDiff,
    inline: true
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    diff: sampleDiff,
    viewMode: "line-by-line",
    inline: true
  }
}`,...p.parameters?.docs?.source}}};var m=[`Default`,`LineByLine`,`WithTitle`,`WithFileNames`,`MultiFileDiff`,`SmallDiff`,`AdditionOnly`,`DeletionOnly`,`Inline`,`InlineLineByLine`];export{u as AdditionOnly,i as Default,d as DeletionOnly,f as Inline,p as InlineLineByLine,a as LineByLine,c as MultiFileDiff,l as SmallDiff,s as WithFileNames,o as WithTitle,m as __namedExportsOrder,t as default};