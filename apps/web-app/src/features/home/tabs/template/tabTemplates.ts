import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { templates } from "./registry";

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

export interface TabTemplate<T = unknown> {
  type: string;
  label: string;
  icon: LucideIcon;
  TabBarComponent: TabBarComponent;
  ContentComponent: TabContentComponent;
  CreateDialog?: ComponentType<CreateDialogProps>;
  defaultData?: T;
  onClose?: (tab: Tab) => void;
}

type ExtractDataType<T> = T extends TabTemplate<infer Data> ? Data : never;

export const tabTemplates = Object.values(templates);

export type TabDataMap = {
  [K in keyof typeof templates]: ExtractDataType<(typeof templates)[K]>;
};

export type Tab = {
  [K in keyof typeof templates]: {
    id: string;
    type: K;
    data: ExtractDataType<(typeof templates)[K]>;
  };
}[keyof typeof templates];

export const tabTypeMap = templates;
