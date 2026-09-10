import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const notificationDotVariants = cva(
  "pointer-events-none absolute -right-0.5 -top-0.5 z-10 size-2 rounded-full ring-2 ring-background select-none",
  {
    variants: {
      color: {
        destructive: "bg-destructive",
        primary: "bg-primary",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        info: "bg-blue-500",
      },
    },
    defaultVariants: {
      color: "destructive",
    },
  },
);

interface NotificationDotProps
  extends
    Omit<React.ComponentProps<"span">, "color">,
    VariantProps<typeof notificationDotVariants> {
  visible?: boolean;
}

function NotificationDot({
  className,
  color,
  visible = true,
  ...props
}: NotificationDotProps) {
  if (!visible) return null;
  return (
    <span
      data-slot="notification-dot"
      data-color={color}
      aria-hidden="true"
      className={cn(notificationDotVariants({ color }), className)}
      {...props}
    />
  );
}

export { NotificationDot, notificationDotVariants };
export type { NotificationDotProps };
