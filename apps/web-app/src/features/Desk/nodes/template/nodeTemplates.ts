import type { ComponentType, CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";

export interface NodeTemplate {
  id: string;
  label: string;
  icon: LucideIcon;
  size?: CSSProperties;
  /** for setting dialog before add node */
  configDialog?: ComponentType<ConfigDialogProps>;
  /** initial data data */
  defaultData?: Record<string, unknown>;
  component: ComponentType<any>;
}

export interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data?: Record<string, unknown>) => void;
}
