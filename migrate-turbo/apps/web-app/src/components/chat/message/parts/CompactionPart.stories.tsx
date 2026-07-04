import type { Meta, StoryObj } from "@storybook/react";
import { CompactionPart } from "./CompactionPart";

const meta: Meta<typeof CompactionPart> = {
  title: "Chat/Message/Parts/CompactionPart",
  component: CompactionPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Compaction part data from SDK",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CompactionPart>;

export const AutoCompaction: Story = {
  args: {
    part: {
      type: "compaction",
      auto: true,
    } as any,
  },
};

export const ManualCompaction: Story = {
  args: {
    part: {
      type: "compaction",
      auto: false,
    } as any,
  },
};
