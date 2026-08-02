import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsDetailHeaderProps {
  title: string;
}

export function SettingsDetailHeader({ title }: SettingsDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Back to settings"
        onClick={() => navigate({ to: "/settings" })}
      >
        <ArrowLeft className="size-5" />
      </Button>
      <h2 className="font-semibold">{title}</h2>
    </header>
  );
}
