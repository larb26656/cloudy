import {
  CodeBlockContainer,
  CodeBlockCopyButton,
  CodeBlockHeader,
  type CustomRendererProps,
} from "streamdown";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import {
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  Scan,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/dialog";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 1.2;
const VIEW_PADDING = 48;

const peleTheme = {
  "--pele-bg": "var(--background)",
  "--pele-fg": "var(--foreground)",
  "--pele-muted": "var(--muted-foreground)",
  "--pele-line": "var(--border)",
  "--pele-surface": "var(--muted)",
  "--pele-surface-alt": "var(--accent)",
  "--pele-border": "var(--border)",
} as CSSProperties;

type Point = { x: number; y: number };

type ViewState = {
  zoom: number;
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function usePele(
  ref: React.RefObject<HTMLDivElement | null>,
  source: string,
  enabled = true,
) {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = ref.current;
    if (!container || !enabled) return;

    let cancelled = false;
    let destroy = () => {};

    setError(null);
    setReady(false);
    container.replaceChildren();

    import("pele")
      .then(({ mount }) => {
        if (cancelled || !container.isConnected) return;

        const diagram = mount(container, source, {
          zoom: false,
          onError: (err) => {
            if (cancelled) return;
            setError(err instanceof Error ? err.message : String(err));
          },
        });

        destroy = () => diagram.destroy();
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      destroy();
      container.replaceChildren();
    };
  }, [ref, source, enabled]);

  return { error, ready };
}

export function PeleMermaidRenderer({
  code: source,
  language,
  isIncomplete,
}: CustomRendererProps) {
  const inlineRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { error } = usePele(inlineRef, source, !isIncomplete);

  return (
    <CodeBlockContainer isIncomplete={isIncomplete} language={language}>
      <div className="flex items-center justify-between">
        <CodeBlockHeader language={language} />

        <div
          data-streamdown="code-block-actions"
          className="pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Open diagram fullscreen"
            disabled={isIncomplete}
            className={"text-muted-foreground"}
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="size-4" />
          </Button>

          <CodeBlockCopyButton code={source} />
        </div>
      </div>

      <div className="mx-2 mb-2 overflow-hidden rounded-lg border bg-background">
        {isIncomplete ? (
          <div className="flex h-48 items-center justify-center bg-muted">
            <span className="text-sm text-muted-foreground">
              Loading diagram...
            </span>
          </div>
        ) : (
          <>
            <div
              ref={inlineRef}
              className="pele min-h-24 overflow-auto p-4"
              style={peleTheme}
            />

            {error && (
              <div className="border-t px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          showCloseButton={false}
          className="
            !fixed !inset-0 !top-0 !left-0
            !h-dvh !w-screen !max-w-none
            !translate-x-0 !translate-y-0
            flex flex-col gap-0
            overflow-hidden rounded-none border-0 p-0
            sm:!max-w-none
          "
        >
          <DialogTitle className="sr-only">Mermaid diagram</DialogTitle>

          {isFullscreen && (
            <FullscreenDiagram
              source={source}
              onClose={() => setIsFullscreen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </CodeBlockContainer>
  );
}

function FullscreenDiagram({
  source,
  onClose,
}: {
  source: string;
  onClose: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { error, ready } = usePele(diagramRef, source);

  const [view, setView] = useState<ViewState>({
    zoom: 1,
    x: 0,
    y: 0,
  });

  const [dragging, setDragging] = useState(false);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const fittedRef = useRef(false);

  const getContentSize = useCallback(() => {
    const content = contentRef.current;
    if (!content) return null;

    return {
      width: content.offsetWidth,
      height: content.offsetHeight,
    };
  }, []);

  const fitToScreen = useCallback(() => {
    const viewport = viewportRef.current;
    const size = getContentSize();

    if (!viewport || !size) return;
    if (!size.width || !size.height) return;

    const availableWidth = Math.max(1, viewport.clientWidth - VIEW_PADDING * 2);
    const availableHeight = Math.max(
      1,
      viewport.clientHeight - VIEW_PADDING * 2,
    );

    const zoom = clamp(
      Math.min(availableWidth / size.width, availableHeight / size.height, 1),
      MIN_ZOOM,
      MAX_ZOOM,
    );

    setView({
      zoom,
      x: (viewport.clientWidth - size.width * zoom) / 2,
      y: (viewport.clientHeight - size.height * zoom) / 2,
    });
  }, [getContentSize]);

  const resetView = useCallback(() => {
    const viewport = viewportRef.current;
    const size = getContentSize();

    if (!viewport || !size) return;

    setView({
      zoom: 1,
      x: (viewport.clientWidth - size.width) / 2,
      y: (viewport.clientHeight - size.height) / 2,
    });
  }, [getContentSize]);

  const zoomAt = useCallback((nextZoom: number, point?: Point) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const center = point ?? {
      x: viewport.clientWidth / 2,
      y: viewport.clientHeight / 2,
    };

    setView((previous) => {
      const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);

      const ratio = zoom / previous.zoom;

      return {
        zoom,
        x: center.x - (center.x - previous.x) * ratio,
        y: center.y - (center.y - previous.y) * ratio,
      };
    });
  }, []);

  const zoomIn = () => {
    zoomAt(view.zoom * ZOOM_STEP);
  };

  const zoomOut = () => {
    zoomAt(view.zoom / ZOOM_STEP);
  };

  const handleWheel = (event: ReactWheelEvent) => {
    event.preventDefault();

    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const factor = Math.exp(-event.deltaY * 0.0015);

    zoomAt(view.zoom * factor, point);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    event.preventDefault();

    viewport.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
    };

    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    setView((previous) => ({
      ...previous,
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    }));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    setDragging(false);

    const viewport = viewportRef.current;

    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
  };

  // Fit when the diagram becomes available.
  useLayoutEffect(() => {
    if (!ready || fittedRef.current) return;

    const content = contentRef.current;
    if (!content) return;

    let frame = 0;

    const observer = new ResizeObserver(() => {
      if (fittedRef.current) return;

      if (content.offsetWidth && content.offsetHeight) {
        cancelAnimationFrame(frame);

        frame = requestAnimationFrame(() => {
          fitToScreen();
          fittedRef.current = true;
        });
      }
    });

    observer.observe(content);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ready, fitToScreen]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-sm font-medium">Mermaid diagram</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Drag to pan · Scroll to zoom
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={zoomOut}
          >
            <Minus className="size-4" />
          </Button>

          <span className="w-14 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(view.zoom * 100)}%
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={zoomIn}
          >
            <Plus className="size-4" />
          </Button>

          <div className="mx-1 h-5 w-px bg-border" />

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Fit to screen"
            title="Fit to screen"
            onClick={fitToScreen}
          >
            <Scan className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Reset zoom"
            title="Reset zoom"
            onClick={resetView}
          >
            <RotateCcw className="size-4" />
          </Button>

          <div className="mx-1 h-5 w-px bg-border" />

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Exit fullscreen"
            title="Exit fullscreen"
            onClick={onClose}
          >
            <Minimize2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 overflow-hidden select-none ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ touchAction: "none" }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`,
          }}
        >
          <div ref={contentRef} className="inline-block w-max p-4">
            <div
              ref={diagramRef}
              className="pele pointer-events-none"
              style={peleTheme}
            />
          </div>
        </div>

        {!ready && !error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Loading diagram...
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex h-9 shrink-0 items-center justify-between border-t px-4 text-xs text-muted-foreground">
        <span>{error ? "Render failed" : "Mermaid"}</span>
        <span>{Math.round(view.zoom * 100)}%</span>
      </div>

      {error && (
        <div className="shrink-0 border-t px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
