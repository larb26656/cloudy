import type { Meta, StoryObj } from "@storybook/react";
import { ReasoningPart } from "./ReasoningPart";

const meta: Meta<typeof ReasoningPart> = {
  title: "Chat/Message/Parts/ReasoningPart",
  component: ReasoningPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Reasoning part data from SDK",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReasoningPart>;

export const Default: Story = {
  args: {
    part: {
      type: "reasoning",
      text: "Let me analyze this problem step by step...",
      time: {
        start: Date.now() - 5000,
        end: Date.now(),
      },
    } as any,
  },
};

export const WithDuration: Story = {
  args: {
    part: {
      type: "reasoning",
      text: "Thinking about the best approach to solve this...",
      time: {
        start: Date.now() - 10000,
        end: Date.now(),
      },
    } as any,
  },
};

export const LongReasoning: Story = {
  args: {
    part: {
      type: "reasoning",
      text: "Let me think through this complex problem:\n\n1. First, I need to understand the requirements\n2. Then analyze the current codebase structure\n3. Design a solution that handles edge cases\n4. Implement the feature with proper error handling\n5. Write tests to ensure reliability\n\nThis requires careful consideration of multiple factors...",
      time: {
        start: Date.now() - 15000,
        end: Date.now(),
      },
    } as any,
  },
};
