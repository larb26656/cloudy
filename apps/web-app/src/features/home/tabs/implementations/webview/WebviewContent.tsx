import { useState } from "react";
import { Globe, RotateCw } from "lucide-react";
import type { Tab } from "@/stores/tabStore";
import { useTabStore } from "@/stores/tabStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeUrl } from "./meta";

interface WebviewContentProps {
  tab: Extract<Tab, { type: "webview" }>;
}

export function WebviewContent({ tab }: WebviewContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);
  const [urlInput, setUrlInput] = useState(tab.data.url);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleNavigate = () => {
    const normalized = normalizeUrl(urlInput);
    if (!normalized) return;
    setUrlInput(normalized);
    setIsLoading(true);
    updateTabData(tab.id, { url: normalized });
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/30">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          <RotateCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        <div className="flex-1 flex items-center rounded-md border bg-background px-2 py-1 gap-2">
          <Globe className="size-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNavigate();
            }}
            className="h-6 border-0 p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Enter URL"
          />
        </div>
      </div>
      <div className="flex-1 relative">
        <iframe
          key={refreshKey}
          src={tab.data.url}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Webview"
        />
      </div>
    </div>
  );
}
