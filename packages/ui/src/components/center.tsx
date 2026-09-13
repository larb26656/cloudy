import React from "react";
import { cn } from "@repo/ui/lib/utils";

type CenterProps = React.HTMLAttributes<HTMLDivElement>;

export function Center({ className, children, ...props }: CenterProps) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </div>
  );
}
