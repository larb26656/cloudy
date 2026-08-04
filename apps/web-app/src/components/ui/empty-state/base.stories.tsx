import preview from "@/storybook/preview";
import { Inbox } from "lucide-react";
import { Button } from "../button";
import { EmptyState } from "./base";

const meta = preview.meta({
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "select", options: ["full", "compact", "inline"] },
  },
});

export default meta;

export const FullDefault = meta.story({
  args: {
    size: "full",
    title: "No workspaces yet",
    description: "Create your first workspace to get started.",
  },
  render: (args) => (
    <div className="w-96 border rounded">
      <EmptyState
        {...args}
        icon={Inbox}
        action={<Button>Create workspace</Button>}
      />
    </div>
  ),
});

export const FullNoIcon = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <EmptyState size="full" title="Nothing here yet" />
    </div>
  ),
});

export const Compact = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <EmptyState
        size="compact"
        icon={Inbox}
        title="No items"
        description="Add one to get started."
      />
    </div>
  ),
});

export const Inline = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <EmptyState size="inline" icon={Inbox} title="No items" />
    </div>
  ),
});

export const InlineNoIcon = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <EmptyState size="inline" title="No items" />
    </div>
  ),
});

export const WithImage = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <EmptyState
        size="full"
        image="/mascot/404.png"
        title="Page not found"
        description="The page you're looking for doesn't exist."
      />
    </div>
  ),
});
