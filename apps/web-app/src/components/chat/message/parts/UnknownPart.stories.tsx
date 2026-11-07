import preview from "@/storybook/preview";
import { UnknownPart } from "@repo/ui/components/message";

const meta = preview.meta({
  title: "Chat/Message/Parts/UnknownPart",
  component: UnknownPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Unrecognized provider message part",
    },
  },
});

export default meta;

export const Default = meta.story({
  args: {
    part: {
      id: "part-1",
      type: "unknown",
      providerType: "vendor_activity",
      data: { phase: "review", detail: "Reviewing changes" },
    },
  },
});

export const WithToolDetails = meta.story({
  args: {
    part: {
      id: "part-2",
      type: "unknown",
      providerType: "vendor_tool_activity",
      data: { tool: "search", callID: "call-1", query: "message parts" },
    },
  },
});

export const EmptyData = meta.story({
  args: {
    part: {
      id: "part-3",
      type: "unknown",
      providerType: "vendor_event",
    },
  },
});
