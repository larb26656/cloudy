import preview from "@/storybook/preview";
import { GrepTool } from "./GrepTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/GrepTool",
  component: GrepTool,
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

export const PatternOnly = meta.story({
  name: "Pattern only",
  args: {
    tool: "grep",
    state: {
      status: "completed",
      input: { pattern: "createXxxApp" },
      output: "Found 12 matches",
      title: "grep",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000120 },
    } as any,
  },
});

export const WithPathAndInclude = meta.story({
  name: "With path & include",
  args: {
    tool: "grep",
    state: {
      status: "completed",
      input: {
        pattern: "HTTPException",
        path: "packages/server/src",
        include: "*.ts",
      },
      output: "Found 8 matches",
      title: "grep",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000090 },
    } as any,
  },
});

export const Running = meta.story({
  args: {
    tool: "grep",
    state: {
      status: "running",
      input: { pattern: "useWorkspaceStore" },
      time: { start: 1690000000000 },
    } as any,
  },
});

export const Error = meta.story({
  args: {
    tool: "grep",
    state: {
      status: "error",
      input: { pattern: "[" },
      error: "Invalid regular expression: unterminated character class",
      time: { start: 1690000000000, end: 1690000000010 },
    } as any,
  },
});
