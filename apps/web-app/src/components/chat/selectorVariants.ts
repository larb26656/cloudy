import { cva } from "@repo/ui/lib/utils";

export const selectorTriggerVariants = cva(
  "inline-flex items-center justify-center gap-1",
  {
    variants: {
      variant: {
        form: "h-9 w-full justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50",
        chat: "h-8 w-auto justify-center gap-2 border-0 px-2 text-xs shadow-none",
        status:
          "h-auto w-auto max-w-32 justify-center rounded-md border bg-muted/50 px-1.5 py-0.5 text-foreground transition-colors hover:bg-muted",
      },
    },
    defaultVariants: {
      variant: "form",
    },
  },
);

export type SelectorTriggerVariant = "form" | "chat" | "status";
