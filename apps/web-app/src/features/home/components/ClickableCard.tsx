import type { ButtonHTMLAttributes } from "react";

import { cn } from "@repo/ui/lib/utils";

type ClickableCardProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function ClickableCard({ className, ...props }: ClickableCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-xl border bg-card text-left transition-colors hover:border-foreground/15",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
}
