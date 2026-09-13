import type { LucideIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";

interface NodeMenuButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function NodeMenuButton({
  icon: Icon,
  label,
  onClick,
}: NodeMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="justify-start gap-2 h-8"
      onClick={onClick}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </Button>
  );
}
