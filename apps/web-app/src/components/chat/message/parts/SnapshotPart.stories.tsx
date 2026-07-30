import preview from "@/storybook/preview";
import { SnapshotPart } from "./SnapshotPart";

const meta = preview.meta({
  title: "Chat/Message/Parts/SnapshotPart",
  component: SnapshotPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Snapshot part data from SDK",
    },
  },
});

export default meta;

export const Default = meta.story({
  args: {
    part: {
      type: "snapshot",
      snapshot: '{"conversationId": "abc123", "step": 5}',
    } as any,
  },
});

export const LongSnapshot = meta.story({
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
});
