import preview from "@/storybook/preview";
import { CompactionPart } from "./CompactionPart";

const meta = preview.meta({
  title: "Chat/Message/Parts/CompactionPart",
  component: CompactionPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Compaction part data from SDK",
    },
  },
});

export default meta;

export const AutoCompaction = meta.story({
  args: {
    part: {
      type: "compaction",
      auto: true,
    } as any,
  },
});

export const ManualCompaction = meta.story({
  args: {
    part: {
      type: "compaction",
      auto: false,
    } as any,
  },
});
