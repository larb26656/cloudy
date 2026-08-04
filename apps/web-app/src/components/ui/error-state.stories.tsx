import { WifiOff } from "lucide-react";
import preview from "@/storybook/preview";
import { ErrorState } from "./error-state";

const meta = preview.meta({
  title: "UI/ErrorState",
  component: ErrorState,
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
    title: "Error",
    message: "Failed to load data. Please try again.",
  },
  render: (args) => (
    <div className="w-96 border rounded">
      <ErrorState {...args} onRetry={() => undefined} />
    </div>
  ),
});

export const FullNoRetry = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <ErrorState size="full" message="Failed to load data." />
    </div>
  ),
});

export const Compact = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <ErrorState
        size="compact"
        message="Failed to load."
        onRetry={() => undefined}
      />
    </div>
  ),
});

export const Inline = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <ErrorState size="inline" message="Failed to load." />
    </div>
  ),
});

export const LongMessage = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <ErrorState
        size="full"
        message="We couldn't complete your request due to a network issue. Please check your connection and try again. If the problem persists, contact support."
        onRetry={() => undefined}
      />
    </div>
  ),
});

export const Bare = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <ErrorState bare message="Something went wrong." />
    </div>
  ),
});

export const CustomIcon = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <ErrorState
        size="full"
        icon={WifiOff}
        title="Network error"
        message="You appear to be offline."
        onRetry={() => undefined}
      />
    </div>
  ),
});

export const CustomRetryLabel = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <ErrorState
        size="full"
        message="Connection lost."
        retryLabel="Reconnect"
        onRetry={() => undefined}
      />
    </div>
  ),
});

export const WithClassName = meta.story({
  render: () => (
    <div className="w-96 border rounded">
      <ErrorState
        size="full"
        message="Failed to load."
        className="bg-muted/40"
        onRetry={() => undefined}
      />
    </div>
  ),
});
