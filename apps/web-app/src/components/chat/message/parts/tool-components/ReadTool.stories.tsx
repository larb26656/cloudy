import preview from "@/storybook/preview";
import { ReadTool } from "./ReadTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/ReadTool",
  component: ReadTool,
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

export const Basic = meta.story({
  args: {
    tool: "read",
    state: {
      status: "completed",
      input: { filePath: "packages/server/src/server.ts" },
      output: "Read 142 lines",
      title: "read",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000050 },
    } as any,
  },
});

export const WithOffsetAndLimit = meta.story({
  name: "With offset & limit",
  args: {
    tool: "read",
    state: {
      status: "completed",
      input: {
        filePath: "apps/web-app/src/App.tsx",
        offset: 100,
        limit: 50,
      },
      output: "Read 50 lines",
      title: "read",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000040 },
    } as any,
  },
});

export const Pending = meta.story({
  args: {
    tool: "read",
    state: {
      status: "pending",
      input: {},
      raw: "{}",
    } as any,
  },
});

export const Error = meta.story({
  args: {
    tool: "read",
    state: {
      status: "error",
      input: { filePath: "src/missing.ts" },
      error: "ENOENT: no such file or directory",
      time: { start: 1690000000000, end: 1690000000010 },
    } as any,
  },
});
