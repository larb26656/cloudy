import { useReactFlow } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "lodash-es";
import { cn } from "@/lib/utils";
import { TextIcon } from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  const autoresize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    el.style.width = "auto";
    el.style.width = `${el.scrollWidth}px`;
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      debouncedUpdateText(e.target.value);
      autoresize();
    },
    [autoresize, debouncedUpdateText],
  );

  const handleBlur = useCallback(() => {
    debouncedUpdateText.flush();
  }, [debouncedUpdateText]);

  useEffect(() => {
    autoresize();
  }, [text, size, autoresize]);

  return (
    <div
      className={cn(
        "inline-flex flex-col items-start rounded-lg bg-transparent p-2 border border-transparent transition-colors",
        selected && "border-primary/50 border-solid",
      )}
    >
      {selected && (
        <div className="flex items-center gap-1 mb-2">
          {(Object.keys(sizeMap) as TextSize[]).map((s) => (
            <button
              key={s}
              onClick={() => handleSizeChange(s)}
              className={cn(
                "px-2 py-0.5 text-xs rounded border transition-colors",
                size === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border",
              )}
            >
              {sizeLabels[s]}
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onInput={autoresize}
        placeholder="Text..."
        rows={1}
        cols={1}
        wrap="soft"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className={cn(
          "bg-transparent resize-none outline-none placeholder:text-gray-400 text-gray-700 overflow-hidden whitespace-pre",
          textClass,
        )}
        style={{ height: "auto", width: "auto" }}
      />
    </div>
  );
}

export { TextIcon as textNodeIcon };
