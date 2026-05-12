export interface ContextItem {
  id: string;
  type: string;
  data: unknown;
  replace: boolean;
  timestamp: string;
}

export interface ContextUpdateEvent {
  action: "added" | "removed" | "cleared";
  item?: ContextItem;
  contexts: ContextItem[];
}
