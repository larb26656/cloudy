import type { Meta, StoryObj } from "@storybook/react";
import { StepStartPart } from "./StepStartPart";

const meta: Meta<typeof StepStartPart> = {
  title: "Chat/Message/Parts/StepStartPart",
  component: StepStartPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Step start part data from SDK",
    },
  },
};

export default meta;
type Story = StoryObj<typeof StepStartPart>;

export const Default: Story = {
  args: {
    part: {
      type: "step-start",
      snapshot: '{"step": 1, "action": "analyze"}',
    } as any,
  },
};

export const WithDetailedSnapshot: Story = {
  args: {
    part: {
      type: "step-start",
      snapshot: '{"step": 3, "action": "code", "file": "src/App.tsx"}',
    } as any,
  },
};
