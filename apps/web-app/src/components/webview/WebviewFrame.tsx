import { useState } from "react";
import { Globe, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { normalizeUrl } from "@/lib/url";

export interface WebviewFrameProps {
  url: string;
  /**
   * Called with the normalized URL when the user navigates via the address
   * bar. When omitted, the address bar is read-only.
   */
  onUrlChange?: (url: string) => void;
  className?: string;
}

/**
 * Presentational webview: address bar + refresh + sandboxed iframe. Owns no
 * URL state of its own — the caller controls `url` and persists changes via
 * `onUrlChange`. Shared by the webview tab and the webview desk node.
 */
export function WebviewFrame({
  url,
  onUrlChange,
  className,
}: WebviewFrameProps) {
  const [urlInput, setUrlInput] = useState(url);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleNavigate = () => {
    const normalized = normalizeUrl(urlInput);
    if (!normalized) return;
    setUrlInput(normalized);
    setIsLoading(true);
    onUrlChange?.(normalized);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center gap-1 border-b bg-muted/30 px-2 py-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          <RotateCw className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
        <div className="flex flex-1 items-center gap-2 rounded-md border bg-background px-2 py-1">
          <Globe className="size-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNavigate();
            }}
            className="h-6 border-0 p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Enter URL"
            readOnly={!onUrlChange}
          />
        </div>
      </div>
      <div className="relative flex-1">
        <iframe
          key={refreshKey}
          src={url}
          className="h-full w-full border-0"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Webview"
        />
      </div>
    </div>
  );
}
