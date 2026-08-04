import { useState } from "react";
import preview from "@/storybook/preview";
import { Button } from "@/components/ui/button";
import { WebviewCreateDialog } from "./WebviewCreateDialog";

/**
 * Demo wrapper that owns the `open` state so the story can exercise the dialog.
 * NOTE: submitting the dialog calls the real `useTabStore.addTab`, which writes
 * to Storybook's own localStorage — it never touches your real browser data.
 */
function WebviewCreateDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <p className="text-sm text-muted-foreground">
        Dialog starts closed — click the button to open it.
      </p>
      <WebviewCreateDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

const meta = preview.meta({
  title: "Webview/WebviewCreateDialog",
  component: WebviewCreateDialogDemo,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Default = meta.story({});
