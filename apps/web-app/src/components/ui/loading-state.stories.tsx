import { RotateCw } from "lucide-react";
import preview from "@/storybook/preview";
import { LoadingState } from "./loading-state";

const meta = preview.meta({
  title: "UI/LoadingState",
  component: LoadingState,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "select", options: ["full", "compact", "inline"] },
  },
});

export default meta;

export const Full = meta.story({
  args: {
    size: "full",
    title: "Loading",
    message: "Fetching your data...",
  },
  render: (args) => (
    <div className="w-96 border rounded">
      <LoadingState {...args} />
    </div>
  ),
});

export const FullNoMessage = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <LoadingState size="full" />
    </div>
  ),
});

export const Compact = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <LoadingState size="compact" message="Fetching..." />
    </div>
  ),
});

export const Inline = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <LoadingState size="inline" />
    </div>
  ),
});

export const Silent = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <LoadingState size="full" title={null} />
    </div>
  ),
});

export const TextOnly = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <LoadingState size="full" title="Loading sessions..." spinner={false} />
    </div>
  ),
});

export const CustomSpinner = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <LoadingState
        size="full"
        title={null}
        spinner={<RotateCw className="size-5 animate-spin" />}
      />
    </div>
  ),
});

export const WithClassName = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <LoadingState size="full" className="bg-muted/40" />
    </div>
  ),
});
