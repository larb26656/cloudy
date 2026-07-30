import preview from "@/storybook/preview";
import { AgentPart } from "./AgentPart";

const meta = preview.meta({
  title: "Chat/Message/Parts/AgentPart",
  component: AgentPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Agent part data from SDK",
    },
  },
});

export default meta;

export const Default = meta.story({
  args: {
    part: {
      type: "agent",
      name: "code-reviewer",
    } as any,
  },
});

export const WithSource = meta.story({
  args: {
    part: {
      type: "agent",
      name: "code-reviewer",
      source: {
        type: "text" as const,
        value: "const agent = require('@opencode-ai/code-reviewer');",
        start: 0,
        end: 40,
      },
    } as any,
  },
});
