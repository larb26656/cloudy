import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface SheetScrollAreaProps {
  children: ReactNode;
  className?: string;
}

export default function SheetScrollArea({
  children,
  className,
}: SheetScrollAreaProps) {
  return (
    <div className={cn("flex-1 px-4 overflow-y-auto", className)}>
      {children}
    </div>
  );
}
