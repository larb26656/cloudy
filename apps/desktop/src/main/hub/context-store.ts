import { randomUUID } from "node:crypto";
import type {
  ContextItem,
  AddContextOptions,
  AddContextResult,
} from "./types";

type BroadcastFn = (event: string, data: unknown) => void;
type FocusWindowFn = () => void;

export class HubContextStore {
  private items: Map<string, ContextItem> = new Map();
  private broadcast: BroadcastFn;
  private focusWindow: FocusWindowFn;

  constructor(broadcast: BroadcastFn, focusWindow: FocusWindowFn) {
    this.broadcast = broadcast;
    this.focusWindow = focusWindow;
  }

  add(options: AddContextOptions): AddContextResult {
    const replace = options.replace ?? false;

    if (replace) {
      for (const [existingId, existing] of this.items) {
        if (existing.type === options.type) {
          const updated: ContextItem = {
            ...existing,
            data: options.data,
            timestamp: new Date().toISOString(),
          };
          this.items.set(existingId, updated);
          this.emit("replaced", updated);
          this.focusWindow();
          return { status: "replaced", id: existingId };
        }
      }
    }

    const id = randomUUID();
    const item: ContextItem = {
      id,
      type: options.type,
      data: options.data,
      replace,
      timestamp: new Date().toISOString(),
    };
    this.items.set(id, item);
    this.emit("added", item);
    this.focusWindow();
    return { status: "added", id };
  }

  remove(id: string): boolean {
    const item = this.items.get(id);
    if (!item) return false;
    this.items.delete(id);
    this.emit("removed", item);
    return true;
  }

  clear(): void {
    this.items.clear();
    this.broadcast("context:update", {
      action: "cleared",
      contexts: [],
    });
  }

  list(): ContextItem[] {
    return Array.from(this.items.values());
  }

  private emit(
    action: "added" | "removed" | "replaced",
    item: ContextItem,
  ): void {
    this.broadcast("context:update", {
      action,
      item,
      contexts: this.list(),
    });
  }
}
