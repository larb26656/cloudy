import preview from "@/storybook/preview";
import { StepStartPart } from "./StepStartPart";

const meta = preview.meta({
  title: "Chat/Message/Parts/StepStartPart",
  component: StepStartPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Step start part data from SDK",
    },
  },
});

export default meta;

export const Default = meta.story({
  args: {
    part: {
      type: "step-start",
      snapshot: '{"step": 1, "action": "analyze"}',
    } as any,
  },
});

export const WithDetailedSnapshot = meta.story({
  args: {
    part: {
      type: "step-start",
      snapshot: '{"step": 3, "action": "code", "file": "src/App.tsx"}',
    } as any,
  },
});
