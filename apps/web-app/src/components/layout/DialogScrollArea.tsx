import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface DialogScrollAreaProps {
  children: ReactNode;
  className?: string;
  isLimitSize?: boolean;
}

export default function DialogScrollArea({
  children,
  className,
  isLimitSize = false,
}: DialogScrollAreaProps) {
  return (
    <div
      className={cn(
        "-mx-4 overflow-y-auto px-4",
        className,
        !isLimitSize && "max-h-[70vh]",
      )}
    >
      {children}
    </div>
  );
}
