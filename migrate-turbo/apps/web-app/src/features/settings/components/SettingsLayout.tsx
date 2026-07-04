import type { ReactNode } from "react";
import { useDeviceType } from "@/hooks";
import { cn } from "@/lib/utils";

interface SettingsLayoutProps {
  menu: ReactNode;
  detail: ReactNode;
  className?: string;
}

export function SettingsLayout({ menu, detail, className }: SettingsLayoutProps) {
  const { isMobile } = useDeviceType();

  if (isMobile) {
    return <div className={cn("flex flex-col h-full", className)}>{detail}</div>;
  }

  return (
    <div
      className={cn("flex h-full overflow-hidden bg-background", className)}
    >
      <div className="w-64 shrink-0 border-r overflow-y-auto">{menu}</div>
      <div className="flex-1 overflow-y-auto">{detail}</div>
    </div>
  );
}
