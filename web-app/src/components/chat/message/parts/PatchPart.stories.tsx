import type { Meta, StoryObj } from "@storybook/react";
import { PatchPart } from "./PatchPart";

const meta: Meta<typeof PatchPart> = {
  title: "Chat/Message/Parts/PatchPart",
  component: PatchPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Patch part data from SDK",
    },
  },
};

export default meta;
type Story = StoryObj<typeof PatchPart>;

export const Default: Story = {
  args: {
    part: {
      type: "patch",
      hash: "abc123def456",
      files: [],
    } as any,
  },
};

export const WithFiles: Story = {
  args: {
    part: {
      type: "patch",
      hash: "abc123def456",
      files: ["src/App.tsx", "src/index.ts", "package.json"],
    } as any,
  },
};
