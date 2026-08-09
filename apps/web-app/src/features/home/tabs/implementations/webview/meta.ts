import { Globe } from "lucide-react";
import type { TabTemplate, TabTitleProps } from "../../template";
import { WebviewContent } from "./WebviewContent";
import { WebviewCreateDialog } from "./WebviewCreateDialog";

export type WebviewData = {
  url: string;
};

export { normalizeUrl } from "@/lib/url";

function WebviewTabTitle({ data }: TabTitleProps<WebviewData>) {
  try {
    return new URL(data.url).hostname;
  } catch {
    return data.url;
  }
}

export const webviewTemplate: TabTemplate<WebviewData> = {
  type: "webview",
  label: "New Webview",
  icon: Globe,
  TitleComponent: WebviewTabTitle,
  ContentComponent: WebviewContent,
  CreateDialog: WebviewCreateDialog,
};
