import preview from "@/storybook/preview";
import { useState } from "react";
import { FileUpdateViewer } from "./index";
import type { FileItem } from "./index";

const meta = preview.meta({
  title: "FileViewer/FileUpdateViewer",
  component: FileUpdateViewer,
  tags: ["autodocs"],
});

export default meta;

const createModeFiles: FileItem[] = [
  {
    name: "README.md",
    path: "/project/README.md",
    content: `# Welcome to the Project

This is a new file that was just created.

## Features

- Feature A
- Feature B
- Feature C
`,
  },
  {
    name: "index.ts",
    path: "/project/index.ts",
    content: `export function hello() {
  console.log("Hello, World!");
}

export const version = "1.0.0";
`,
  },
  {
    name: "utils.ts",
    path: "/project/utils.ts",
    content: `export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
`,
  },
];

const editModeFiles: FileItem[] = [
  {
    name: "README.md",
    path: "/project/README.md",
    content: `# Welcome to the Project

This is an updated file with new content.

## Features

- Feature A
- Feature B
- Feature C
- Feature D
`,
    originalContent: `# Welcome to the Project

This is the original file content.

## Features

- Feature A
- Feature B
- Feature C
`,
  },
  {
    name: "index.ts",
    path: "/project/index.ts",
    content: `export function hello(name: string) {
  console.log(\`Hello, \${name}!\`);
}

export const version = "2.0.0";
`,
    originalContent: `export function hello() {
  console.log("Hello, World!");
}

export const version = "1.0.0";
`,
  },
];

const mixedModeFiles: FileItem[] = [
  {
    name: "README.md",
    path: "/project/README.md",
    content: `# Welcome

This is a new file.`,
  },
  {
    name: "config.json",
    path: "/project/config.json",
    content: `{
  "name": "updated-project",
  "version": "1.0.0"
}`,
    originalContent: `{
  "name": "project",
  "version": "0.9.0"
}`,
  },
  {
    name: "notes.md",
    path: "/project/notes.md",
    content: `# Notes

- Buy groceries
- Walk the dog`,
  },
];

function InteractiveStory({
  files,
  defaultSelected,
}: {
  files: FileItem[];
  defaultSelected?: string;
}) {
  const [selectedFile, setSelectedFile] = useState(defaultSelected ?? files[0]?.name);

  return (
    <div className="h-[500px] border rounded-lg overflow-hidden">
      <FileUpdateViewer
        files={files}
        selectedFile={selectedFile}
        onSelectFile={(file) => setSelectedFile(file.name)}
      />
    </div>
  );
}

export const Default = meta.story({
  render: () => <InteractiveStory files={mixedModeFiles} defaultSelected="config.json" />,
});

export const CreateMode = meta.story({
  render: () => <InteractiveStory files={createModeFiles} defaultSelected="README.md" />,
});

export const CreateModeIndexSelected = meta.story({
  render: () => <InteractiveStory files={createModeFiles} defaultSelected="index.ts" />,
});

export const EditMode = meta.story({
  render: () => <InteractiveStory files={editModeFiles} defaultSelected="README.md" />,
});

export const EditModeIndexSelected = meta.story({
  render: () => <InteractiveStory files={editModeFiles} defaultSelected="index.ts" />,
});

export const MixedMode = meta.story({
  render: () => <InteractiveStory files={mixedModeFiles} defaultSelected="config.json" />,
});

export const EmptyFiles = meta.story({
  render: () => (
    <div className="h-[500px] border rounded-lg overflow-hidden">
      <FileUpdateViewer files={[]} />
    </div>
  ),
});

export const NoFileSelected = meta.story({
  render: () => (
    <div className="h-[500px] border rounded-lg overflow-hidden">
      <FileUpdateViewer files={createModeFiles} />
    </div>
  ),
});
