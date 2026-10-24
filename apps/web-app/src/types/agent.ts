export interface Agent {
  id: string;
  providerId?: string;
  name: string;
  description?: string;
  mode: "subagent" | "primary" | "all";
  native?: boolean;
  hidden?: boolean;
}
