import preview from "@/storybook/preview";
import { WebTool } from "./WebTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/WebTool",
  component: WebTool,
  tags: ["autodocs"],
  argTypes: {
    tool: { control: "text", description: "Tool name (webfetch or websearch)" },
    state: {
      control: "object",
      description: "Tool state from SDK",
    },
  },
});

export default meta;

export const WebFetch = meta.story({
  name: "webfetch - URL",
  args: {
    tool: "webfetch",
    state: {
      status: "completed",
      input: {
        url: "https://opencode.ai/docs",
        format: "markdown",
        timeout: 30,
      },
      output: "Fetched 12.4 KB",
      title: "webfetch",
      metadata: {},
      time: { start: 1690000000000, end: 1690000003200 },
    } as any,
  },
});

export const WebSearch = meta.story({
  name: "websearch - query",
  args: {
    tool: "websearch",
    state: {
      status: "completed",
      input: { query: "drizzle ORM pglite setup" },
      output: "Found 10 results",
      title: "websearch",
      metadata: {},
      time: { start: 1690000000000, end: 1690000001800 },
    } as any,
  },
});

export const Pending = meta.story({
  args: {
    tool: "webfetch",
    state: {
      status: "pending",
      input: {},
      raw: "{}",
    } as any,
  },
});

export const Error = meta.story({
  args: {
    tool: "webfetch",
    state: {
      status: "error",
      input: { url: "https://example.invalid", timeout: 10 },
      error: "fetch failed: ETIMEDOUT",
      time: { start: 1690000000000, end: 1690000010000 },
    } as any,
  },
});

export const LongUrl = meta.story({
  name: "Long URL (wraps in preview)",
  args: {
    tool: "webfetch",
    state: {
      status: "running",
      input: {
        url: "https://github.com/anomalyco/opencode/blob/main/packages/server/src/features/auth/auth.service.ts",
      },
      time: { start: 1690000000000 },
    } as any,
  },
});
