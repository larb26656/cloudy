import { useState } from "react";

import preview from "@/storybook/preview";
import { CodeEditor, type CodeEditorProps } from "./code-editor";

function CodeEditorDemo({ value: initialValue, ...props }: CodeEditorProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <CodeEditor
      {...props}
      value={value}
      onValueChange={setValue}
      className="w-[36rem]"
    />
  );
}

const meta = preview.meta({
  title: "UI/CodeEditor",
  component: CodeEditorDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    language: {
      control: "select",
      options: ["plaintext", "typescript", "json"],
    },
    onValueChange: {
      control: false,
    },
  },
});

export default meta;

export const TypeScript = meta.story({
  args: {
    value: "function greet(name: string) {\n  return `Hello, ${name}`;\n}",
    onValueChange: () => undefined,
    language: "typescript",
  },
});

export const Json = meta.story({
  args: {
    value: '{\n  "name": "cloudy",\n  "enabled": true\n}',
    onValueChange: () => undefined,
    language: "json",
  },
});

export const PlainText = meta.story({
  args: {
    value: "A small editable text snippet.",
    onValueChange: () => undefined,
    language: "plaintext",
  },
});

export const Disabled = meta.story({
  args: {
    value: "const locked = true;",
    onValueChange: () => undefined,
    language: "typescript",
    disabled: true,
  },
});
