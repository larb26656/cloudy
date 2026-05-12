import { Clipboard, type LucideIcon } from "lucide-react";
import { useContextStore } from "@/stores/contextStore";
import type { ContextItem } from "@/types/context";

export type ContextProviderHandler = () => Promise<void>;

export type ContextProvider = {
  type: string;
  label: string;
  icon: LucideIcon;
  handler: ContextProviderHandler;
};

export const contextProviders: ContextProvider[] = [
  {
    type: "clipboard",
    label: "Clipboard content",
    icon: Clipboard,
    handler: async () => {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const item: ContextItem = {
        id: crypto.randomUUID(),
        type: "clipboard",
        data: {
          // TODO replace with utils lib
          label: `Clipboard: ${text.slice(0, 50)}${text.length > 50 ? "..." : ""}`,
          content: text,
        },
        replace: true,
        timestamp: new Date().toISOString(),
      };

      useContextStore.getState().addContext(item);
    },
  },
];