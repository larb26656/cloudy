import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import { debounce } from "lodash-es";
import { AlertCircle, Code, X } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { WindowFrame } from "../WindowFrame";

type MermaidNodeProps = Node<
  {
    code?: string;
    label?: string;
  },
  "mermaid"
>;

const DEFAULT_CODE = "";

export function MermaidNode({
  data,
  id,
  selected,
}: NodeProps<MermaidNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const [code, setCode] = useState(data.code ?? DEFAULT_CODE);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderVersionRef = useRef(0);

  useEffect(() => {
    setCode(data.code ?? DEFAULT_CODE);
  }, [data.code]);

  const debouncedSave = useMemo(
    () => debounce((value: string) => updateNodeData(id, { code: value }), 500),
    [id, updateNodeData],
  );

  useEffect(() => {
    return () => debouncedSave.flush();
  }, [debouncedSave]);

  const renderMermaid = useCallback(
    async (mermaidCode: string) => {
      const renderVersion = ++renderVersionRef.current;

      if (!mermaidCode.trim()) {
        setSvg("");
        setError("");
        setIsGenerating(false);
        return;
      }

      setIsGenerating(true);
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default ?? mermaidModule;

        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "dark" ? "dark" : "neutral",
        });

        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "-");
        const { svg: renderedSvg } = await mermaid.render(
          `mermaid-${safeId}-${renderVersion}`,
          mermaidCode,
        );
        if (renderVersion !== renderVersionRef.current) return;

        setSvg(renderedSvg);
        setError("");
      } catch (err) {
        if (renderVersion !== renderVersionRef.current) return;

        setError(err instanceof Error ? err.message : "Failed to render");
      } finally {
        if (renderVersion === renderVersionRef.current) {
          setIsGenerating(false);
        }
      }
    },
    [id, resolvedTheme],
  );

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

  useEffect(() => {
    return () => {
      renderVersionRef.current += 1;
    };
  }, []);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      debouncedSave(value);
    },
    [debouncedSave],
  );

  const handleEditorBlur = useCallback(() => {
    debouncedSave.flush();
  }, [debouncedSave]);

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
          <PopoverTrigger
            render={
              <Button
                aria-label="Edit Mermaid code"
                title="Edit Mermaid code"
                variant="ghost"
                size="icon-xs"
                className={cn("nodrag h-6 w-6", open && "bg-muted")}
              />
            }
          >
            <Code className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={8}
            className="h-96 w-[min(32rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`mermaid-code-${id}`}
                    className="text-sm font-medium"
                  >
                    Mermaid code
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Live preview
                  </span>
                </div>
                <Button
                  aria-label="Close Mermaid editor"
                  title="Close"
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CodeEditor
                id={`mermaid-code-${id}`}
                value={code}
                onValueChange={handleCodeChange}
                onBlur={handleEditorBlur}
                placeholder={"flowchart TD\n  A[Start] --> B[End]"}
                className="min-h-0 flex-1 rounded-none border-0"
              />
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 border-t bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span className="line-clamp-3">{error}</span>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      }
    >
      <div className="relative flex h-full w-full items-center justify-center overflow-auto bg-muted/30 p-4">
        {svg ? (
          <div
            className="flex max-h-full max-w-full items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : error ? (
          <ErrorState size="inline" bare message="Fix errors to see diagram" />
        ) : code.trim() ? (
          <LoadingState size="inline" title="Rendering..." />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="nodrag rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Code className="mr-1 inline h-4 w-4" />
            Add Mermaid code
          </button>
        )}
        {isGenerating && svg && (
          <LoadingState
            size="inline"
            title="Updating..."
            className="absolute right-2 top-2 rounded-md border bg-background/90"
          />
        )}
        {error && svg && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md border border-destructive/30 bg-background/90 px-2 py-1 text-xs text-destructive">
            <AlertCircle className="size-3" />
            Preview shows the last valid diagram
          </div>
        )}
      </div>
    </WindowFrame>
  );
}
