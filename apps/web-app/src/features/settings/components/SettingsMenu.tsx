import { Link } from "@tanstack/react-router";
import { Palette, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingCategory = "personalize" | "model" | "instance";

interface SettingMenuItem {
  id: SettingCategory;
  label: string;
  description: string;
  icon: typeof Palette;
  to: string;
}

const menuItems: SettingMenuItem[] = [
  {
    id: "instance",
    label: "Instance",
    description: "Manage connections",
    icon: Server,
    to: "/settings/instance",
  },
];

interface SettingsMenuProps {
  activeCategory?: SettingCategory;
  className?: string;
}

export function SettingsMenu({ activeCategory, className }: SettingsMenuProps) {
  return (
    <nav className={cn("p-2", className)}>
      <div className="space-y-1">
        {menuItems.map(({ id, label, description, icon: Icon, to }) => {
          const isActive = activeCategory === id;
          return (
            <Link
              key={id}
              to={to as "/settings/personalize" extends "/" ? never : typeof to}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 text-sm transition-colors",
                "hover:bg-muted",
                isActive ? "bg-muted" : "bg-transparent",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium">{label}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
