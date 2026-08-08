import { Globe } from "lucide-react";
import type { TabTemplate } from "../../template";
import { WebviewContent } from "./WebviewContent";
import { WebviewTabItem } from "./WebviewTabItem";
import { WebviewCreateDialog } from "./WebviewCreateDialog";

export type WebviewData = {
  url: string;
};

export { normalizeUrl } from "@/lib/url";

export const webviewTemplate: TabTemplate<WebviewData> = {
  type: "webview",
  label: "New Webview",
  icon: Globe,
  TabBarComponent: WebviewTabItem,
  ContentComponent: WebviewContent,
  CreateDialog: WebviewCreateDialog,
};
