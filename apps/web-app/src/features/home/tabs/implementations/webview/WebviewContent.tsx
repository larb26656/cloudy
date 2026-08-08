import type { Tab } from "@/stores/tabStore";
import { useTabStore } from "@/stores/tabStore";
import { WebviewFrame } from "@/components/webview";

interface WebviewContentProps {
  tab: Extract<Tab, { type: "webview" }>;
}

export function WebviewContent({ tab }: WebviewContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);

  return (
    <WebviewFrame
      url={tab.data.url}
      onUrlChange={(url) => updateTabData(tab.id, { url })}
      className="h-full"
    />
  );
}
