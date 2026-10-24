import {
  Palette,
  MessageSquareText,
  PlugZap,
  BrainCircuit,
  Bot,
  Pin,
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
    id: "llm-connections",
    label: "LLM Connections",
    description: "Configure API connections used by Cloudy AI.",
    to: "/settings/llm-connections",
    icon: BrainCircuit,
  },
  {
    id: "agents",
    label: "Cloudy Agents",
    description: "Create agents and customize their system prompts.",
    to: "/settings/agents",
    icon: Bot,
  },
  {
    id: "agent-providers",
    label: "Agent Providers",
    description: "Configure agent and session providers.",
    to: "/settings/agent-providers",
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
    id: "pinned-agents",
    label: "Pinned Agents",
    description: "Choose which agents appear on the home page.",
    to: "/settings/pinned-agents",
    icon: Pin,
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
