import type { Meta, StoryObj } from "@storybook/react";
import { StepFinishPart } from "./StepFinishPart";

const meta: Meta<typeof StepFinishPart> = {
  title: "Chat/Message/Parts/StepFinishPart",
  component: StepFinishPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Step finish part data from SDK",
    },
    info: {
      control: "object",
      description: "Optional assistant message info",
    },
  },
};

export default meta;
type Story = StoryObj<typeof StepFinishPart>;

export const Default: Story = {
  args: {
    part: {
      type: "step-finish",
      tokens: {
        input: 1500,
        output: 500,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
      cost: 0.0025,
    } as any,
  },
};

export const WithReasoning: Story = {
  args: {
    part: {
      type: "step-finish",
      tokens: {
        input: 2000,
        output: 800,
        reasoning: 1500,
        cache: {
          read: 500,
          write: 200,
        },
      },
      cost: 0.0045,
    } as any,
  },
};

export const WithModelInfo: Story = {
  args: {
    part: {
      type: "step-finish",
      tokens: {
        input: 1000,
        output: 300,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
      cost: 0.0015,
    } as any,
    info: {
      modelID: "claude-3-opus",
    } as any,
  },
};

export const ZeroCost: Story = {
  args: {
    part: {
      type: "step-finish",
      tokens: {
        input: 0,
        output: 0,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
      cost: 0,
    } as any,
  },
};
