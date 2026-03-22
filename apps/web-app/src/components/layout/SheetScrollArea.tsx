import { type ReactNode } from "react";

interface SheetScrollAreaProps {
  children: ReactNode;
}

export default function SheetScrollArea({ children }: SheetScrollAreaProps) {
  return <div className="flex-1 px-4 overflow-y-auto">{children}</div>;
}
