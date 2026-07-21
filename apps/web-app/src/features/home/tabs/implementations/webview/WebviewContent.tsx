import { useState } from "react";
import { Globe, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import type { Tab } from "@/stores/tabStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { webviewActions } from "./webviewActions";

interface WebviewContentProps {
  tab: Extract<Tab, { type: "webview" }>;
}

export function WebviewContent({ tab }: WebviewContentProps) {
  const [urlInput, setUrlInput] = useState(tab.data.url);
  const [isLoading, setIsLoading] = useState(false);

  const canGoBack = tab.data.historyIndex > 0;
  const canGoForward = tab.data.historyIndex < tab.data.history.length - 1;

  const handleNavigate = () => {
    let normalizedUrl = urlInput.trim();
    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://")
    ) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    setUrlInput(normalizedUrl);
    webviewActions.navigate(tab.id, normalizedUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNavigate();
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setUrlInput(tab.data.url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/30">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canGoBack}
          onClick={() => webviewActions.goBack(tab.id)}
          aria-label="Go back"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canGoForward}
          onClick={() => webviewActions.goForward(tab.id)}
          aria-label="Go forward"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => webviewActions.navigate(tab.id, tab.data.url)}
          aria-label="Refresh"
        >
          <RotateCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        <div className="flex-1 flex items-center rounded-md border bg-background px-2 py-1 gap-2">
          <Globe className="size-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleNavigate}
            className="h-6 border-0 p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Enter URL"
          />
        </div>
      </div>
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <RotateCw className="size-6 animate-spin" />
          </div>
        )}
        <iframe
          src={tab.data.url}
          className="w-full h-full border-0"
          onLoad={() => handleIframeLoad()}
          onLoadStart={() => setIsLoading(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Webview"
        />
      </div>
    </div>
  );
}
