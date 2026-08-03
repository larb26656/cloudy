import { useReactFlow } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { debounce } from "lodash-es";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { WindowFrame } from "../WindowFrame";

type StickyColor = "yellow" | "pink" | "green" | "blue" | "purple" | "orange";

type StickyNoteNodeProps = Node<
  {
    label?: string;
    color?: StickyColor;
  },
  "sticky"
>;

const colorClasses: Record<StickyColor, string> = {
  yellow: "bg-yellow-100 border-yellow-300",
  pink: "bg-pink-100 border-pink-300",
  green: "bg-emerald-100 border-emerald-300",
  blue: "bg-blue-100 border-blue-300",
  purple: "bg-purple-100 border-purple-300",
  orange: "bg-orange-100 border-orange-300",
};

export function StickyNoteNode({
  data,
  id,
  selected,
}: NodeProps<StickyNoteNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const [text, setText] = useState(data.label ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setText(data.label ?? "");
  }, [data.label]);

  const debouncedUpdateLabel = useMemo(
    () => debounce((value: string) => updateNodeData(id, { label: value }), 500),
    [id, updateNodeData],
  );

  useEffect(() => {
    return () => debouncedUpdateLabel.cancel();
  }, [debouncedUpdateLabel]);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      debouncedUpdateLabel(value);
    },
    [debouncedUpdateLabel],
  );

  const handleBlur = useCallback(() => {
    debouncedUpdateLabel.flush();
  }, [debouncedUpdateLabel]);

  const color = data.color ?? "yellow";
  const bgClass = colorClasses[color];

  const handleColorChange = useCallback(
    (newColor: StickyColor) => {
      updateNodeData(id, { color: newColor });
      setPickerOpen(false);
    },
    [id, updateNodeData],
  );

  return (
    <WindowFrame
      nodeId={id}
      selected={selected}
      minWidth={150}
      minHeight={100}
      maxWidth={400}
      maxHeight={300}
      color={bgClass}
      headerClassName="bg-transparent border-current/20"
      headerAction={
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger className="nodrag flex items-center gap-1 px-2 py-1 rounded hover:bg-black/10">
            <div className={cn("w-4 h-4 rounded-full border border-black/20", bgClass)} />
            <ChevronDown className="h-3 w-3 opacity-60" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-2">
              {(Object.keys(colorClasses) as StickyColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                    colorClasses[c],
                    color === c ? "border-foreground" : "border-transparent",
                  )}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      }
    >
      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="Write something..."
        className={cn(
          "h-full w-full p-2 bg-transparent resize-none outline-none",
          "text-sm text-gray-800 placeholder:text-gray-400",
        )}
      />
    </WindowFrame>
  );
}
