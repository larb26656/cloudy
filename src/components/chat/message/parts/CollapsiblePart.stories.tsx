import type { Meta, StoryObj } from "@storybook/react";
import CollapsiblePart from "./CollapsiblePart";

const meta: Meta<typeof CollapsiblePart> = {
  title: "Chat/Message/Parts/CollapsiblePart",
  component: CollapsiblePart,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label for the collapsible trigger",
    },
    detail: {
      control: "text",
      description: "Optional detail text shown next to label",
    },
    children: {
      control: "text",
      description: "Content inside the collapsible",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CollapsiblePart>;

export const Default: Story = {
  args: {
    label: "Section",
    detail: "Details here",
    children: <div className="p-2">This is the collapsible content.</div>,
  },
};

export const WithoutDetail: Story = {
  args: {
    label: "Section",
    children: <div className="p-2">Content without detail</div>,
  },
};
