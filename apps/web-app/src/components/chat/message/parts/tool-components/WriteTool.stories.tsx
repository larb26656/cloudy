import preview from "@/storybook/preview";
import { WriteTool } from "./WriteTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/WriteTool",
  component: WriteTool,
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

const sampleContent = `export function add(a: number, b: number): number {
  return a + b;
}
`;

export const NewFile = meta.story({
  args: {
    tool: "write",
    state: {
      status: "completed",
      input: {
        filePath: "packages/math/src/add.ts",
        content: sampleContent,
      },
      output: "Wrote 3 lines",
      title: "write",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000030 },
    } as any,
  },
});

export const EmptyContent = meta.story({
  name: "Empty content",
  args: {
    tool: "write",
    state: {
      status: "completed",
      input: { filePath: "packages/math/src/empty.ts", content: "" },
      output: "Wrote 0 lines",
      title: "write",
      metadata: {},
      time: { start: 1690000000000, end: 1690000000010 },
    } as any,
  },
});
