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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TabBarComponent = ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TabContentComponent = ComponentType<any>;

export interface TabTemplate {
  type: Tab["type"];
  label: string;
  icon: LucideIcon;
  TabBarComponent: TabBarComponent;
  ContentComponent: TabContentComponent;
  CreateDialog?: ComponentType<CreateDialogProps>;
  defaultData?: unknown;
}
