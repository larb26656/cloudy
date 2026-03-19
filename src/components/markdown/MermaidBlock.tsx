import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import panzoom from "panzoom";
import { v4 as uuidv4 } from "uuid";

interface MermaidBlockProps {
  chart: string;
  height?: number;
}

const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ReturnType<typeof panzoom> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const id = "mermaid-" + uuidv4();

    containerRef.current.innerHTML = `<div id="${id}" class="mermaid" style="width:100%;height:100%;visibility:hidden;">${chart}</div>`;

    mermaid.initialize({ theme: "dark" });

    const initPanZoom = () => {
      const svg = containerRef.current?.querySelector("svg");
      const mermaidEl = containerRef.current?.querySelector(`#${id}`) as HTMLElement | null;
      if (mermaidEl) {
        mermaidEl.style.visibility = "visible";
      }
      if (svg && !zoomRef.current) {
        svg.style.maxWidth = "100%";
        zoomRef.current = panzoom(svg, {
          minZoom: 0.5,
          maxZoom: 5,
          bounds: true,
          boundsPadding: 0.5,
        });
      }
    };

    try {
      const mermaidEl = containerRef.current.querySelector(
        `#${id}`,
      ) as HTMLElement | null;
      if (mermaidEl) {
        mermaid.run({ nodes: [mermaidEl] }).then(initPanZoom);
      }
    } catch (e) {
      console.error("Mermaid render error:", e);
    }

    return () => {
      if (zoomRef.current) {
        zoomRef.current.dispose();
        zoomRef.current = null;
      }
    };
  }, [chart]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto [&_.mermaid]:w-full [&_.mermaid]:h-full [&_svg]:w-full [&_svg]:h-full [&_svg]:cursor-move"
    />
  );
};

const MermaidBlockInner: React.FC<MermaidBlockProps> = ({ chart }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="flex flex-col gap-2 text-lg p-8 m-4"
        onClick={() => setIsOpen(true)}
      >
        Mermaid Diagram
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className=" w-full h-full max-w-full max-h-full lg:w-[95vw] lg:h-[95vh] lg:max-w-[95vw] lg:max-h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-4 shrink-0">
            <DialogTitle>Mermaid Diagram</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
            <MermaidDiagram chart={chart} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const MermaidBlock = React.memo(MermaidBlockInner, (prev, next) => {
  return prev.chart === next.chart;
});
