import type { Meta, StoryObj } from "@storybook/react";
import { SubtaskPart } from "./SubtaskPart";

const meta: Meta<typeof SubtaskPart> = {
  title: "Chat/Message/Parts/SubtaskPart",
  component: SubtaskPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Subtask part data from SDK",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SubtaskPart>;

export const Default: Story = {
  args: {
    part: {
      type: "subtask",
      agent: "code-reviewer",
      description: "Review the PR for best practices",
    } as any,
  },
};

export const WithPrompt: Story = {
  args: {
    part: {
      type: "subtask",
      agent: "test-generator",
      description: "Generate unit tests",
      prompt: "Create tests for the authentication module covering:\n- Login flow\n- Password reset\n- Token refresh",
    } as any,
  },
};

export const WithoutAgent: Story = {
  args: {
    part: {
      type: "subtask",
      description: "Analyze the codebase structure",
    } as any,
  },
};
