export interface ContextItem {
  id: string;
  type: string;
  data: unknown;
  replace: boolean;
  timestamp: string;
}

export interface AddContextOptions {
  type: string;
  data: unknown;
  replace?: boolean;
}

export type AddContextResult =
  | { status: "added"; id: string }
  | { status: "replaced"; id: string };

export interface ContextUpdateEvent {
  action: "added" | "removed" | "cleared";
  item?: ContextItem;
  contexts: ContextItem[];
}
