import type { Meta, StoryObj } from "@storybook/react";
import { SnapshotPart } from "./SnapshotPart";

const meta: Meta<typeof SnapshotPart> = {
  title: "Chat/Message/Parts/SnapshotPart",
  component: SnapshotPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Snapshot part data from SDK",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SnapshotPart>;

export const Default: Story = {
  args: {
    part: {
      type: "snapshot",
      snapshot: '{"conversationId": "abc123", "step": 5}',
    } as any,
  },
};

export const LongSnapshot: Story = {
  args: {
    part: {
      type: "snapshot",
      snapshot: `{
  "conversationId": "abc123",
  "step": 5,
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"}
  ]
}`,
    } as any,
  },
};
