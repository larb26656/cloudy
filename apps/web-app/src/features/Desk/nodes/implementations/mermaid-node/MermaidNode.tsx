import { useCallback, useEffect, useState, useRef } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { WindowFrame } from "../WindowFrame";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Code, X } from "lucide-react";
import { cn } from "@/lib/utils";

type MermaidNodeProps = Node<
  {
    code?: string;
    label?: string;
  },
  "mermaid"
>;

const DEFAULT_CODE = "";

export function MermaidNode({ data, id, selected }: NodeProps<MermaidNodeProps>) {
  const [code, setCode] = useState(data.code ?? DEFAULT_CODE);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderMermaid = useCallback(async (mermaidCode: string) => {
    if (!mermaidCode.trim()) {
      setSvg("");
      setError("");
      return;
    }

    setIsGenerating(true);
    try {
      const mermaidModule = await import("mermaid");
      const mermaid = mermaidModule.default ?? mermaidModule;

      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#3b82f6",
          primaryTextColor: "#1f2937",
          primaryBorderColor: "#d1d5db",
          lineColor: "#6b7280",
          secondaryColor: "#f3f4f6",
          tertiaryColor: "#e5e7eb",
        },
      });

      const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, mermaidCode);
      setSvg(renderedSvg);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render");
      setSvg("");
    } finally {
      setIsGenerating(false);
    }
  }, [id]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      renderMermaid(code);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [code, renderMermaid]);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
  }, []);

  return (
    <WindowFrame
      title={data.label ?? "Mermaid"}
      nodeId={id}
      selected={selected}
      minWidth={300}
      minHeight={200}
      maxWidth={800}
      maxHeight={600}
      headerAction={
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger>
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                "h-6 w-6",
                open && "bg-muted"
              )}
            >
              <Code className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={8}
            className="w-80 p-0"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-sm font-medium">Mermaid Code</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="graph TD&#10;  A[Start] --> B[End]"
                className="flex-1 rounded-none border-0 resize-none focus-visible:ring-0"
              />
              {error && (
                <div className="px-3 py-2 text-xs text-destructive border-t bg-destructive/10">
                  {error}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      }
    >
      <div className="h-full w-full flex items-center justify-center overflow-auto p-4 bg-muted/30">
        {isGenerating && code.trim() ? (
          <div className="text-sm text-muted-foreground">Rendering...</div>
        ) : svg ? (
          <div
            className="max-w-full max-h-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : error ? (
          <div className="text-sm text-destructive">Fix errors to see diagram</div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Click <Code className="inline h-4 w-4" /> to add mermaid code
          </div>
        )}
      </div>
    </WindowFrame>
  );
}
