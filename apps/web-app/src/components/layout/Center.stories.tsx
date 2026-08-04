import preview from "@/storybook/preview";
import { Center } from "./Center";

const meta = preview.meta({
  title: "Layout/Center",
  component: Center,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

export default meta;

export const Default = meta.story({
  args: { children: "Centered content" },
});

export const FullHeight = meta.story({
  args: {
    className: "h-full bg-muted text-muted-foreground",
    children: "Centered in full-height area",
  },
});
