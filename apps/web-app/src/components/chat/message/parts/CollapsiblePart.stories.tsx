import preview from "@/storybook/preview";
import CollapsiblePart from "./CollapsiblePart";

const meta = preview.meta({
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
});

export default meta;

export const Default = meta.story({
  args: {
    label: "Section",
    detail: "Details here",
    children: <div className="p-2">This is the collapsible content.</div>,
  },
});

export const WithoutDetail = meta.story({
  args: {
    label: "Section",
    children: <div className="p-2">Content without detail</div>,
  },
});
