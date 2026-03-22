import { type ReactNode } from "react";

interface DialogScrollAreaProps {
  children: ReactNode;
}

export default function DialogScrollArea({ children }: DialogScrollAreaProps) {
  return (
    <div className="-mx-4 overflow-y-auto max-h-[70vh] px-4">{children}</div>
  );
}
