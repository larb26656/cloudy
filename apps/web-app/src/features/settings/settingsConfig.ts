import { Palette, type LucideIcon } from "lucide-react";

export interface SettingsSection {
  id: string;
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

export const settingsSections: SettingsSection[] = [
  {
    id: "appearance",
    label: "Appearance",
    description: "Customize how the app looks on your device.",
    to: "/settings/appearance",
    icon: Palette,
  },
];
