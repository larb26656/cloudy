import { useReactFlow } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { debounce } from "lodash-es";
import { cn } from "@/lib/utils";
import { FramelessNode } from "../FramelessNode";

type TextSize = "s" | "m" | "l";

type TextNodeProps = Node<
  {
    text?: string;
    size?: TextSize;
  },
  "text"
>;

const sizeMap: Record<TextSize, { textClass: string }> = {
  s: { textClass: "text-sm" },
  m: { textClass: "text-base" },
  l: { textClass: "text-lg" },
};

const sizeLabels: Record<TextSize, string> = {
  s: "S",
  m: "M",
  l: "L",
};

export function TextNode({ data, id, selected }: NodeProps<TextNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const [text, setText] = useState(data.text ?? "");
  const size = data.size ?? "m";
  const { textClass } = sizeMap[size];

  useEffect(() => {
    setText(data.text ?? "");
  }, [data.text]);

  const debouncedUpdateText = useMemo(
    () => debounce((value: string) => updateNodeData(id, { text: value }), 500),
    [id, updateNodeData],
  );

  useEffect(() => {
    return () => debouncedUpdateText.cancel();
  }, [debouncedUpdateText]);

  const handleSizeChange = useCallback(
    (newSize: TextSize) => {
      updateNodeData(id, { size: newSize });
    },
    [id, updateNodeData],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      debouncedUpdateText(e.target.value);
    },
    [debouncedUpdateText],
  );

  const handleBlur = useCallback(() => {
    debouncedUpdateText.flush();
  }, [debouncedUpdateText]);

  return (
    <FramelessNode
      nodeId={id}
      selected={selected}
      title="Text"
      toolbar={
        <div className="flex items-center gap-1">
          {(Object.keys(sizeMap) as TextSize[]).map((s) => (
            <button
              key={s}
              onClick={() => handleSizeChange(s)}
              className={cn(
                "px-2 py-0.5 text-xs rounded border transition-colors",
                size === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background/80 backdrop-blur hover:bg-muted border-border",
              )}
            >
              {sizeLabels[s]}
            </button>
          ))}
        </div>
      }
      minWidth={120}
      minHeight={60}
      maxWidth={800}
      maxHeight={600}
    >
      <textarea
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Text..."
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className={cn(
          "w-full h-full resize-none outline-none bg-transparent",
          "overflow-hidden whitespace-pre-wrap break-words",
          "p-2 placeholder:text-muted-foreground text-foreground",
          textClass,
        )}
      />
    </FramelessNode>
  );
}
