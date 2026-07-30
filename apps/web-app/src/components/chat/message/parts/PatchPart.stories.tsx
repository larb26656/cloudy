import preview from "@/storybook/preview";
import { PatchPart } from "./PatchPart";

const meta = preview.meta({
  title: "Chat/Message/Parts/PatchPart",
  component: PatchPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Patch part data from SDK",
    },
  },
});

export default meta;

export const Default = meta.story({
  args: {
    part: {
      type: "patch",
      hash: "abc123def456",
      files: [],
    } as any,
  },
});

export const WithFiles = meta.story({
  args: {
    part: {
      type: "patch",
      hash: "abc123def456",
      files: ["src/App.tsx", "src/index.ts", "package.json"],
    } as any,
  },
});
