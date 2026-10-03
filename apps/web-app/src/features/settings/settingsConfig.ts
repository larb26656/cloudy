import {
  Bot,
  Palette,
  MessageSquareText,
  PlugZap,
  type LucideIcon,
} from "lucide-react";

export interface SettingsSection {
  id: string;
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

export const settingsSections: SettingsSection[] = [
  {
    id: "providers",
    label: "Providers",
    description: "Configure connections for each AI provider.",
    to: "/settings/providers",
    icon: PlugZap,
  },
  {
    id: "agent-model",
    label: "Agent & Model",
    description: "Choose the defaults for new chat sessions.",
    to: "/settings/agent-model",
    icon: Bot,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Customize how the app looks on your device.",
    to: "/settings/appearance",
    icon: Palette,
  },
  {
    id: "quick-phrases",
    label: "Quick Phrases",
    description: "Set up to 10 quick phrases above the chat input.",
    to: "/settings/quick-phrases",
    icon: MessageSquareText,
  },
];
