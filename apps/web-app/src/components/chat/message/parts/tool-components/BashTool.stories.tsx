import preview from "@/storybook/preview";
import { BashTool } from "./BashTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/BashTool",
  component: BashTool,
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

export const Completed = meta.story({
  args: {
    tool: "bash",
    state: {
      status: "completed",
      input: { command: "pnpm run build" },
      output: "✓ built in 4.21s",
      title: "bash",
      metadata: {},
      time: { start: 1690000000000, end: 1690000004210 },
    } as any,
  },
});

export const Running = meta.story({
  args: {
    tool: "bash",
    state: {
      status: "running",
      input: { command: "docker compose up -d" },
      time: { start: 1690000000000 },
    } as any,
  },
});

export const Pending = meta.story({
  args: {
    tool: "bash",
    state: {
      status: "pending",
      input: {},
      raw: "{}",
    } as any,
  },
});

export const Error = meta.story({
  args: {
    tool: "bash",
    state: {
      status: "error",
      input: { command: "git push" },
      error: "fatal: unable to access 'https://github.com/...': Could not resolve host",
      time: { start: 1690000000000, end: 1690000001500 },
    } as any,
  },
});

export const LongCommand = meta.story({
  name: "Long Command (wraps in preview)",
  args: {
    tool: "bash",
    state: {
      status: "running",
      input: {
        command:
          "pnpm --filter @repo/server exec vitest run --project integration src/features/auth/auth.service.integration.test.ts --reporter=verbose",
      },
      time: { start: 1690000000000 },
    } as any,
  },
});
