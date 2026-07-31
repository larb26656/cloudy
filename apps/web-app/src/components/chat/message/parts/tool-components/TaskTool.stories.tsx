import preview from "@/storybook/preview";
import { TaskTool } from "./TaskTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/TaskTool",
  component: TaskTool,
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

export const CompletedWithSession = meta.story({
  name: "Completed (with subtask session)",
  args: {
    tool: "task",
    state: {
      status: "completed",
      input: {
        agent: "explore",
        description: "Find all API route definitions",
        prompt: "Search the codebase for every createXxxApp route factory and list their file paths.",
      },
      output: "Found 6 route factories",
      title: "task",
      metadata: { sessionId: "sess_01HXK2ABCDEFG" },
      time: { start: 1690000000000, end: 1690000008400 },
    } as any,
  },
});

export const Running = meta.story({
  args: {
    tool: "task",
    state: {
      status: "running",
      input: {
        agent: "general",
        description: "Refactor authentication layer",
      },
      metadata: { sessionId: "sess_01RUNNING123" },
      time: { start: 1690000000000 },
    } as any,
  },
});

export const Pending = meta.story({
  name: "Pending (no session yet)",
  args: {
    tool: "task",
    state: {
      status: "pending",
      input: { description: "Generating tests" },
      raw: "{}",
    } as any,
  },
});
