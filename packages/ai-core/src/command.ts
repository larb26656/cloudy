export interface CommandInfo {
  name: string;
  description?: string;
  agent?: string;
  model?: string;
  source?: string;
  template?: string;
  subtask?: boolean;
  hints?: string[];
  immediate?: boolean;
}
