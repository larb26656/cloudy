import type { Meta, StoryObj } from "@storybook/react";
import { AgentPart } from "./AgentPart";

const meta: Meta<typeof AgentPart> = {
  title: "Chat/Message/Parts/AgentPart",
  component: AgentPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Agent part data from SDK",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AgentPart>;

export const Default: Story = {
  args: {
    part: {
      type: "agent",
      name: "code-reviewer",
    } as any,
  },
};

export const WithSource: Story = {
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
};
