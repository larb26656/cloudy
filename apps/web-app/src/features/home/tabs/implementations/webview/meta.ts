import { Globe } from "lucide-react";
import type { TabTemplate } from "../../template";
import { WebviewContent } from "./WebviewContent";
import { WebviewTabItem } from "./WebviewTabItem";
import { WebviewCreateDialog } from "./WebviewCreateDialog";

export type WebviewData = {
  url: string;
};

/**
 * Normalize a user-entered URL: trim, and prepend `https://` when no scheme is
 * present. Empty input is returned as-is. Shared by the create dialog and the
 * address bar so behavior stays identical.
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return "https://" + trimmed;
}

export const webviewTemplate: TabTemplate<WebviewData> = {
  type: "webview",
  label: "New Webview",
  icon: Globe,
  TabBarComponent: WebviewTabItem,
  ContentComponent: WebviewContent,
  CreateDialog: WebviewCreateDialog,
};
