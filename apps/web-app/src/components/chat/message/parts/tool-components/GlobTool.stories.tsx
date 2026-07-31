import preview from "@/storybook/preview";
import { GlobTool } from "./GlobTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/GlobTool",
  component: GlobTool,
  tags: ["autodocs"],
  argTypes: {
    tool: { control: "text", description: "Tool name" },
    state: {
      control: "object",
      description: "Tool state from SDK",
    },
  },
});

export default meta;

export const Pattern = meta.story({
  args: {
    tool: "glob",
    state: {
      status: "completed",
      input: { pattern: "**/*.test.ts" },
      output: "Found 24 files",
      title: "glob",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000080 },
    } as any,
  },
});

export const WithPath = meta.story({
  name: "With path",
  args: {
    tool: "glob",
    state: {
      status: "completed",
      input: {
        pattern: "**/*.tsx",
        path: "apps/web-app/src",
      },
      output: "Found 56 files",
      title: "glob",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000110 },
    } as any,
  },
});

export const Pending = meta.story({
  args: {
    tool: "glob",
    state: {
      status: "pending",
      input: {},
      raw: "{}",
    } as any,
  },
});
