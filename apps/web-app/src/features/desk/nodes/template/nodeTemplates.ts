import type { ComponentType, CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NodeComponent = ComponentType<any>;

export interface NodeTemplate {
  id: string;
  label: string;
  icon: LucideIcon;
  size?: CSSProperties;
  /** for setting dialog before add node */
  configDialog?: ComponentType<ConfigDialogProps>;
  /** initial data data */
  defaultData?: Record<string, unknown>;
  component: NodeComponent;
}

export interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data?: Record<string, unknown>) => void;
}
