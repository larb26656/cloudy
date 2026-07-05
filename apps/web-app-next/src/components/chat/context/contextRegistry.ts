import { Clipboard, type LucideIcon } from "lucide-react";
import { generateId } from "@/lib/id";
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
    label: "Clipboard content (mock)",
    icon: Clipboard,
    handler: async () => {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const item: ContextItem = {
        id: generateId(),
        type: "clipboard",
        data: {
          label: `Clipboard: ${text.slice(0, 50)}${text.length > 50 ? "..." : ""}`,
          content: text,
        },
        replace: true,
        timestamp: new Date().toISOString(),
      };
      void item;
    },
  },
];
