import preview from "@/storybook/preview";
import { DefaultTool } from "./DefaultTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/DefaultTool",
  component: DefaultTool,
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

export const UnknownTool = meta.story({
  name: "Unknown tool (mixed params)",
  args: {
    tool: "custom_tool",
    state: {
      status: "completed",
      input: {
        target: "build-912",
        force: true,
        retries: 3,
        configPath: "/etc/app/config.json",
        notes:
          "This is a long string value that should be truncated in the preview label and shown in full inside the details panel.",
      },
      output: "OK",
      title: "custom_tool",
      metadata: {},
      time: { start: 1690000000000, end: 1690000002100 },
    } as any,
  },
});

export const NestedObject = meta.story({
  name: "Nested object input",
  args: {
    tool: "deploy",
    state: {
      status: "running",
      input: {
        service: "api",
        options: { region: "us-east-1", memory: 512, tags: ["v2", "blue"] },
      },
      time: { start: 1690000000000 },
    } as any,
  },
});

export const Empty = meta.story({
  name: "Empty input",
  args: {
    tool: "noop",
    state: {
      status: "pending",
      input: {},
      raw: "{}",
    } as any,
  },
});

export const Error = meta.story({
  args: {
    tool: "failing_tool",
    state: {
      status: "error",
      input: { command: "do-something-risky" },
      error: "Permission denied",
      time: { start: 1690000000000, end: 1690000000100 },
    } as any,
  },
});
