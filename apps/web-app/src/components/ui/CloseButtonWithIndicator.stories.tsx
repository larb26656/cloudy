import { useState } from "react";
import preview from "@/storybook/preview";
import { CloseButtonWithIndicator } from "./CloseButtonWithIndicator";

const meta = preview.meta({
  title: "UI/CloseButtonWithIndicator",
  component: CloseButtonWithIndicator,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

function RunningIndicator() {
  return (
    <span
      aria-hidden="true"
      className="size-2 rounded-full bg-destructive"
      title="Running"
    />
  );
}

export const WithIndicator = meta.story({
  render: () => (
    <div className="group/closable-item flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <span>Chat tab</span>
      <CloseButtonWithIndicator
        aria-label="Close Chat tab"
        indicator={<RunningIndicator />}
        onClick={() => undefined}
      />
    </div>
  ),
});

export const WithoutIndicator = meta.story({
  render: () => (
    <div className="group/closable-item flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <span>Desk node</span>
      <CloseButtonWithIndicator
        aria-label="Close Desk node"
        onClick={() => undefined}
      />
    </div>
  ),
});

export const CloseOnClick = meta.story({
  render: () => <CloseOnClickDemo />,
});

function CloseOnClickDemo() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen)
    return <span className="text-sm text-muted-foreground">Closed</span>;

  return (
    <div className="group/closable-item flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <span>Running task</span>
      <CloseButtonWithIndicator
        aria-label="Close Running task"
        indicator={<RunningIndicator />}
        onClick={() => setIsOpen(false)}
      />
    </div>
  );
}
