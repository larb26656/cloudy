import type { ReactNode } from "react";
import { useDeviceType } from "@/hooks";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout";
import BackButton from "@/components/ui/back-button";

interface SettingsChildLayoutProps {
  title: string;
  actions?: ReactNode[];
  children: ReactNode;
  className?: string;
}

export function SettingsChildLayout({
  title,
  actions,
  children,
  className,
}: SettingsChildLayoutProps) {
  const { isMobile } = useDeviceType();

  if (isMobile) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <Header
          prefixActions={[<BackButton />]}
          title={title}
          actions={actions}
        />
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 overflow-y-auto h-full", className)}>
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      {children}
    </div>
  );
}
