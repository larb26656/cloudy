import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { Tab } from "@/stores/tabStore";

export interface TabBarProps {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export interface TabContentProps {
  tab: Tab;
}

export interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface TabTemplate {
  type: Tab["type"];
  label: string;
  icon: LucideIcon;
  TabBarComponent: ComponentType<any>;
  ContentComponent: ComponentType<any>;
  CreateDialog?: ComponentType<CreateDialogProps>;
  defaultData?: unknown;
}
