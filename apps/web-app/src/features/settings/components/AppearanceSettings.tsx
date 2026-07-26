"use client";

import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Customize how the app looks on your device.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
            {isDark ? (
              <Moon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Dark Mode</p>
            <p className="text-xs text-muted-foreground">
              Switch between light and dark theme.
            </p>
          </div>
        </div>
        <Switch checked={isDark} onCheckedChange={handleToggle} />
      </div>
    </div>
  );
}
