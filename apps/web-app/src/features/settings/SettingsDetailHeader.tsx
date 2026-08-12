import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppBar } from "@/components/layout";

interface SettingsDetailHeaderProps {
  title: string;
}

export function SettingsDetailHeader({ title }: SettingsDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <AppBar sticky className="md:hidden">
      <AppBar.Leading>
        <AppBar.ActionIcon
          icon={ArrowLeft}
          label="Back to settings"
          onClick={() => navigate({ to: "/settings" })}
        />
      </AppBar.Leading>
      <AppBar.Title>{title}</AppBar.Title>
    </AppBar>
  );
}
