import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export function SettingsHeader({
  title,
  showBackButton = false,
  onBack,
  className,
}: SettingsHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: "/settings" as any });
    }
  };

  return (
    <header
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-background border-b",
        className
      )}
    >
      {showBackButton ? (
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-5" />
        </Button>
      ) : (
        <Settings className="size-5 text-muted-foreground" />
      )}
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
