import type { Meta, StoryObj } from "@storybook/react";
import { FilePart } from "./FilePart";

const meta: Meta<typeof FilePart> = {
  title: "Chat/Message/Parts/FilePart",
  component: FilePart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "File part data from SDK",
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilePart>;

export const Default: Story = {
  args: {
    part: {
      type: "file",
      filename: "package.json",
      mime: "application/json",
      url: "",
    } as any,
  },
};

export const WithMime: Story = {
  args: {
    part: {
      type: "file",
      filename: "image.png",
      mime: "image/png",
      url: "",
    } as any,
  },
};

export const WithFileSource: Story = {
  args: {
    part: {
      type: "file",
      filename: "src/index.ts",
      mime: "text/typescript",
      url: "",
      source: {
        type: "file",
        path: "src/index.ts",
        text: {
          value: "export const x = 1;",
          start: 0,
          end: 17,
        },
      },
    } as any,
  },
};

export const WithSymbolSource: Story = {
  args: {
    part: {
      type: "file",
      filename: "App.tsx",
      mime: "text/typescript",
      url: "",
      source: {
        type: "symbol",
        path: "src/App.tsx",
        symbol: "App",
        range: {
          start: { line: 5, character: 0 },
          end: { line: 10, character: 1 },
        },
      },
    } as any,
  },
};
