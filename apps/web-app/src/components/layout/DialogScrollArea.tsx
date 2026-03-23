import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface DialogScrollAreaProps {
  children: ReactNode;
  isLimitSize?: boolean;
}

export default function DialogScrollArea({
  children,
  isLimitSize = false,
}: DialogScrollAreaProps) {
  return (
    <div
      className={cn(
        "-mx-4 overflow-y-auto px-4",
        !isLimitSize && "max-h-[70vh]",
      )}
    >
      {children}
    </div>
  );
}
